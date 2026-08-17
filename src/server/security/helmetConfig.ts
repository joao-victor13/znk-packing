import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Security Headers & Hardening Middleware (Compatível com Helmet)
 */
export function configureSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // 1. Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.whatsapp.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // 2. Prevenção de Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 3. Prevenção de MIME Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. HTTP Strict Transport Security (HSTS - 1 ano com subdomínios)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 5. Política de Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions-Policy (Desativa recursos sensíveis de hardware)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // 7. Desabilita Header que expõe a tecnologia do servidor
  res.removeHeader('X-Powered-By');

  next();
}
