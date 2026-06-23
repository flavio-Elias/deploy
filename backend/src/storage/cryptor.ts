import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(Bun.env.ENCRYPTION_KEY ?? "", "hex"); // 32 bytes en hex

// Cifra un buffer (imagen o embedding) con AES-256-CBC usando un IV aleatorio nuevo cada vez
export function encrypt(buffer: Buffer): { encrypted: Buffer; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString("hex") };
}

// Descifra un buffer previamente cifrado con encrypt(), usando el mismo IV con el que se cifró
export function decrypt(encryptedBuffer: Buffer, ivHex: string): Buffer {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}