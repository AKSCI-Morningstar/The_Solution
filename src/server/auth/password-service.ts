import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 32;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function serializeHash(hash: Buffer, salt: Buffer): string {
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function parseHash(stored: string): { salt: Buffer; hash: Buffer } {
  const [saltHex, hashHex] = stored.split(":");
  return { salt: Buffer.from(saltHex!, "hex"), hash: Buffer.from(hashHex!, "hex") };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return serializeHash(hash, salt);
}

export function verifyPassword(password: string, stored: string): boolean {
  const { salt, hash: storedHash } = parseHash(stored);
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return timingSafeEqual(hash, storedHash);
}
