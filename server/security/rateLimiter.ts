import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  hits: number[];
}

// Armazenamento em Memória com Sliding Window (em produção, conectar a Redis / Upstash)
const memoryStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs: number;       // Janela de tempo em milissegundos
  maxRequests: number;    // Limite máximo de requisições por janela
  message: string;        // Mensagem de erro ao estourar o limite
  statusCode?: number;    // Código HTTP (default 429)
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message,
    statusCode = 429,
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'anonymous',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = memoryStore.get(key);
    if (!record) {
      record = { hits: [] };
      memoryStore.set(key, record);
    }

    // Remove timestamps fora da janela deslizante
    record.hits = record.hits.filter(timestamp => timestamp > windowStart);

    // Headers padrão de Rate Limiting (IETF draft standard)
    const remaining = Math.max(0, maxRequests - record.hits.length);
    const resetTime = Math.ceil((windowStart + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (record.hits.length >= maxRequests) {
      res.setHeader('Retry-After', resetTime);
      res.status(statusCode).json({
        success: false,
        error: 'TooManyRequests',
        message,
        retryAfterSeconds: resetTime,
      });
      return;
    }

    // Registra a tentativa atual
    record.hits.push(now);
    next();
  };
}

// -----------------------------------------------------------------------------
// POLÍTICAS ESPECÍFICAS DE RATE LIMITING (CYBER SECURITY)
// -----------------------------------------------------------------------------

// 1. Rota Crítica de Login: 5 tentativas a cada 15 minutos por IP
export const authLoginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas consecutivas de login detectadas. Por segurança, tente novamente em 15 minutos.',
  keyGenerator: req => `login:${req.ip}:${req.body?.email || ''}`,
});

// 2. Rotas Globais da API: 100 requisições por minuto por IP
export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
  message: 'Taxa máxima de requisições excedida. Aguarde alguns instantes.',
});

// 3. Criação/Mutação de Pedidos de Compra: 30 operações por minuto
export const orderMutationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Limite de criação de pedidos atingido. Aguarde antes de enviar novos lotes.',
});
