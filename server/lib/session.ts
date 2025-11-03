import crypto from "crypto";

function base64UrlEncode(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signSession(
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds = 60 * 60 * 2,
) {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const body = { ...payload, iat, exp };

  const headerB = base64UrlEncode(JSON.stringify(header));
  const bodyB = base64UrlEncode(JSON.stringify(body));
  const toSign = `${headerB}.${bodyB}`;
  const signature = crypto.createHmac("sha256", secret).update(toSign).digest();
  const sigB = base64UrlEncode(signature);
  return `${toSign}.${sigB}`;
}

export function verifySession(token: string, secret: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB, bodyB, sigB] = parts;
    const toSign = `${headerB}.${bodyB}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(toSign)
      .digest();
    const expectedSigB = base64UrlEncode(expectedSig);
    if (!crypto.timingSafeEqual(Buffer.from(sigB), Buffer.from(expectedSigB)))
      return null;
    const payloadJson = Buffer.from(bodyB, "base64").toString();
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
