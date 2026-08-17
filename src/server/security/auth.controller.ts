import { Request, Response } from 'express';
import crypto from 'crypto';
import { LoginInputSchema } from './validation.schemas';
import { PasswordHasher } from './passwordHasher';

// Mock/Interface do Prisma Client para tipagem e documentação da implementação
interface PrismaUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

interface PrismaContext {
  user: {
    findUnique: (args: any) => Promise<PrismaUser | null>;
    update: (args: any) => Promise<any>;
  };
  refreshToken: {
    create: (args: any) => Promise<any>;
  };
  auditLog: {
    create: (args: any) => Promise<any>;
  };
}

export class AuthController {
  constructor(private prisma: PrismaContext) {}

  /**
   * FLUXO SEGURO DE AUTENTICAÇÃO / LOGIN
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Validação de Schema de Entrada com Zod
    const parseResult = LoginInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    try {
      // 2. Busca de Usuário
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // 3. Proteção contra Enumeração de Usuários
      // Se usuário não existir, executa verificação de hash dummy para manter tempo constante
      if (!user || !user.isActive) {
        await PasswordHasher.verify(password, 'dummy_salt:dummy_hash_to_prevent_timing_attacks');
        await this.logAudit({
          action: 'USER_LOGIN_FAILED',
          entityType: 'User',
          entityId: email,
          ipAddress: clientIp,
          userAgent,
          newState: { reason: 'User not found or inactive' },
        });

        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'E-mail ou senha incorretos.',
        });
        return;
      }

      // 4. Verificação de Bloqueio por Tentativas Falhas (Account Lockout)
      const now = new Date();
      if (user.lockedUntil && user.lockedUntil > now) {
        const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
        res.status(423).json({
          success: false,
          error: 'AccountLocked',
          message: `Conta temporariamente bloqueada devido a múltiplas tentativas falhas. Tente novamente em ${remainingMinutes} minuto(s).`,
        });
        return;
      }

      // 5. Verificação da Senha com Hashing Criptográfico
      const isPasswordValid = await PasswordHasher.verify(password, user.passwordHash);

      if (!isPasswordValid) {
        const attempts = user.failedLoginAttempts + 1;
        const willLock = attempts >= 5;
        const lockedUntil = willLock ? new Date(now.getTime() + 15 * 60 * 1000) : null;

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil,
          },
        });

        await this.logAudit({
          userId: user.id,
          action: willLock ? 'USER_LOCKED' : 'USER_LOGIN_FAILED',
          entityType: 'User',
          entityId: user.id,
          ipAddress: clientIp,
          userAgent,
          newState: { failedAttempts: attempts, locked: willLock },
        });

        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: willLock
            ? 'Conta bloqueada por 15 minutos após 5 tentativas incorretas.'
            : 'E-mail ou senha incorretos.',
        });
        return;
      }

      // 6. Login Bem-Sucedido: Reset de Tentativas e Atualização de Metadados
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
          lastLoginIp: clientIp,
        },
      });

      // 7. Geração de Tokens Criptográficos
      const rawRefreshToken = crypto.randomBytes(40).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      // Salva Refresh Token no banco com data de expiração (7 dias)
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          userAgent,
          ipAddress: clientIp,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // 8. Emissão de Cookies Seguros (HttpOnly, Secure, SameSite=Strict)
      const isProduction = process.env.NODE_ENV === 'production';

      // Access Token (Curto: 15 minutos)
      res.cookie('access_token', `jwt_access_mock_${user.id}`, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutos
        path: '/',
      });

      // Refresh Token (Longo: 7 dias)
      res.cookie('refresh_token', rawRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/api/auth/refresh', // Restrito ao endpoint de renovação
      });

      // 9. Registro no Log de Auditoria
      await this.logAudit({
        userId: user.id,
        action: 'USER_LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user.id,
        ipAddress: clientIp,
        userAgent,
      });

      // 10. Resposta sem dados confidenciais
      res.status(200).json({
        success: true,
        message: 'Autenticado com sucesso.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'InternalServerError',
        message: 'Erro interno durante o processo de autenticação.',
      });
    }
  }

  private async logAudit(data: any) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (e) {
      console.error('Falha ao registrar AuditLog:', e);
    }
  }
}
