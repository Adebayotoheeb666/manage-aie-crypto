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
    if (!token) {
      console.error('No token provided to verifySession');
      return null;
    }

    if (!secret) {
      console.error('No secret provided to verifySession');
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error('Invalid token format: expected 3 parts');
      return null;
    }

    const [headerB, bodyB, sigB] = parts;
    
    // Log the token parts for debugging
    console.log('Token parts:', { headerB, bodyB, sigB });
    
    // Verify signature
    const toSign = `${headerB}.${bodyB}`;
    console.log('To sign:', toSign);
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(toSign)
      .digest();
    const sigB2 = base64UrlEncode(signature);
    
    console.log('Expected signature:', sigB2);
    console.log('Actual signature:', sigB);

    if (sigB !== sigB2) {
      console.error('Invalid token signature');
      console.error('Expected:', sigB2);
      console.error('Actual:', sigB);
      return null;
    }

    // Parse payload
    const payload = JSON.parse(Buffer.from(bodyB, 'base64').toString('utf-8'));
    console.log('Token payload:', payload);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('Token expired');
      console.error('Expiration:', new Date(payload.exp * 1000).toISOString());
      console.error('Current time:', new Date(now * 1000).toISOString());
      return null;
    }

    // Ensure required fields
    if (!payload.sub && !payload.uid) {
      console.error('Token missing required sub/uid field');
      return null;
    }

    return payload;
  } catch (e) {
    console.error('Error in verifySession:', e);
    return null;
  }
}
