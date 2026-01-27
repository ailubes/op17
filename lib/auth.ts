import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export const hashPassword = async (password: string) => {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString("hex");
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS)) as Buffer;
  const storedBuffer = Buffer.from(hash, "hex");
  if (storedBuffer.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derived);
};

