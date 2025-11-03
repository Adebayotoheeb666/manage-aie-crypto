import crypto from "crypto";

type NonceRecord = {
  nonce: string;
  expiresAt: number;
};

// Simple in-memory nonce store. Suitable for demo/dev. For production use a persistent store like Redis.
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, NonceRecord>(); // key: walletAddress.toLowerCase()

export function createNonceForAddress(address: string): string {
  const key = address.toLowerCase();
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + NONCE_TTL_MS;
  store.set(key, { nonce, expiresAt });
  return nonce;
}

export function getNonceForAddress(address: string): string | null {
  const key = address.toLowerCase();
  const rec = store.get(key);
  if (!rec) return null;
  if (rec.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return rec.nonce;
}

export function consumeNonceForAddress(
  address: string,
  nonce: string,
): boolean {
  const key = address.toLowerCase();
  const rec = store.get(key);
  if (!rec) return false;
  if (rec.expiresAt < Date.now()) {
    store.delete(key);
    return false;
  }
  if (rec.nonce !== nonce) return false;
  // consume
  store.delete(key);
  return true;
}
