import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || 'a'.repeat(64), // 32 bytes hex
  'hex'
).slice(0, 32);

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
  };
}

export function decrypt(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
