import bcrypt from 'bcrypt';

/**
 * Custo do bcrypt. O mínimo exigido por RNF-API-07 é 10 — mantido aqui em uma
 * constante nomeada para que uma alteração seja deliberada e visível.
 */
export const BCRYPT_COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
