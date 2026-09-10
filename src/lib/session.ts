// Edge-safe session helpers (used in proxy + server components)
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "inauto_session";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-me"
  );
}

export async function createSessionToken(payload: {
  sub: string;
  email: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { sub: string; email: string };
  } catch {
    return null;
  }
}
