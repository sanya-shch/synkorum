import { SignJWT, jwtVerify } from "jose";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET env variable is not set");
}

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export type SessionPayload = {
  userId: string;
};

export type VerifiedSession = SessionPayload & {
  // Seconds since epoch, from the token's `iat` claim.
  issuedAt: number;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<VerifiedSession | null> {
  try {
    // Pin the algorithm instead of trusting whatever the token header says.
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    if (typeof payload.iat !== "number") return null;
    return { userId: payload.userId, issuedAt: payload.iat };
  } catch {
    // expired, counterfeit, or invalid token
    return null;
  }
}
