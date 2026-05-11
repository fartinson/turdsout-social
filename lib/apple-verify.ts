import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export type AppleIdPayload = {
  sub: string;
  email?: string;
};

export async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string,
): Promise<AppleIdPayload> {
  const { payload } = await jwtVerify(identityToken, JWKS, {
    issuer: "https://appleid.apple.com",
    audience,
  });

  const sub = payload.sub;
  if (!sub) throw new Error("Missing sub");

  return {
    sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}
