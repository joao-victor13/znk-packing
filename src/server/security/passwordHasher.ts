import crypto from 'crypto';

/**
 * Utilitário de Hashing de Senha e Proteção Criptográfica
 * Suporta PBKDF2 com HMAC-SHA512 / Argon2id parameters
 */

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export class PasswordHasher {
  /**
   * Gera hash seguro com salt criptográfico único de 16 bytes
   */
  static async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Validação em tempo constante contra Timing Attacks
   */
  static async verify(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve) => {
      const [salt, key] = storedHash.split(':');
      if (!salt || !key) return resolve(false);

      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
        if (err) return resolve(false);
        const keyBuffer = Buffer.from(key, 'hex');
        const derivedBuffer = derivedKey;
        
        if (keyBuffer.length !== derivedBuffer.length) return resolve(false);
        // timingSafeEqual previne timing attacks
        resolve(crypto.timingSafeEqual(keyBuffer, derivedBuffer));
      });
    });
  }
}
