import axios from "axios";
import { createPublicKey, KeyObject } from "crypto";
import { config } from "../../config/index";

const jwt = require("jsonwebtoken");

type Provider = "google" | "apple";

const PROVIDERS: Record<
  Provider,
  { jwksUrl: string; issuers: string[]; audiences: () => string[] }
> = {
  google: {
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    issuers: ["accounts.google.com", "https://accounts.google.com"],
    audiences: () => splitIds(config.GOOGLE_CLIENT_IDS),
  },
  apple: {
    jwksUrl: "https://appleid.apple.com/auth/keys",
    issuers: ["https://appleid.apple.com"],
    audiences: () => splitIds(config.APPLE_CLIENT_IDS),
  },
};

const JWKS_CACHE_MS = 60 * 60 * 1000;
const jwksCache: Partial<
  Record<Provider, { keys: Map<string, KeyObject>; fetchedAt: number }>
> = {};

function splitIds(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function getSigningKey(provider: Provider, kid: string) {
  const cached = jwksCache[provider];
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_MS && cached.keys.has(kid)) {
    return cached.keys.get(kid);
  }

  // Unknown kid or stale cache: refetch (providers rotate keys).
  const { data } = await axios.get(PROVIDERS[provider].jwksUrl, { timeout: 5000 });
  const keys = new Map<string, KeyObject>();
  for (const jwk of data.keys || []) {
    keys.set(jwk.kid, createPublicKey({ key: jwk, format: "jwk" }));
  }
  jwksCache[provider] = { keys, fetchedAt: Date.now() };
  return keys.get(kid);
}

/**
 * Verifies a Google / Apple ID token and returns the verified email.
 * Throws if the token is invalid, expired, for another app, or has no verified email.
 */
async function verifySocialIdToken(provider: Provider, idToken: string): Promise<string> {
  const audiences = PROVIDERS[provider].audiences();
  if (!audiences.length) {
    throw new Error(`${provider} login is not configured on the server.`);
  }

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid) throw new Error("Invalid ID token.");

  const key = await getSigningKey(provider, kid);
  if (!key) throw new Error("Invalid ID token.");

  const payload = jwt.verify(idToken, key, {
    algorithms: ["RS256"],
    issuer: PROVIDERS[provider].issuers,
    audience: audiences,
  });

  // Google sends a boolean, Apple sends "true"/"false" strings.
  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  if (!payload.email || !emailVerified) {
    throw new Error("ID token has no verified email.");
  }

  // Same value the app used to send from the SDK, so existing users still match.
  return String(payload.email);
}

export default { verifySocialIdToken };
