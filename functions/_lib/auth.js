export const SESSION_COOKIE = "__Host-rsa_session";
export const STATE_COOKIE = "__Host-rsa_oidc_state";

const encoder = new TextEncoder();
const safeReturnPaths = new Set(["/", "/citizenship.html", "/greencard.html", "/passport.html"]);

export function json(value, status) {
  return new Response(JSON.stringify(value), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function cookie(name, value, maxAge, path) {
  return name + "=" + value +
    "; Path=" + (path || "/") +
    "; Max-Age=" + String(maxAge) +
    "; HttpOnly; Secure; SameSite=Lax";
}

export function clearCookie(name) {
  return name + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}

export function redirect(location, cookies) {
  const headers = new Headers({
    "Location": location,
    "Cache-Control": "no-store"
  });
  for (const value of cookies || []) headers.append("Set-Cookie", value);
  return new Response(null, { status: 302, headers });
}

export function readCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) return trimmed.slice(name.length + 1);
  }
  return "";
}

export function safeReturnTo(value) {
  return safeReturnPaths.has(value) ? value : "/";
}

export function randomToken(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size || 32));
  return base64url(bytes);
}

export function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBase64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signPayload(payload, secret) {
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return body + "." + base64url(signature);
}

export async function verifyPayload(token, secret, purpose) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      decodeBase64url(parts[1]),
      encoder.encode(parts[0])
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
    if (!payload || payload.purpose !== purpose || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  return verifyPayload(readCookie(request, SESSION_COOKIE), env.SESSION_SECRET, "app_session");
}

export function issuerUrl(env) {
  return String(env.AUTHENTIK_ISSUER || "").trim().replace(/\/+$/, "");
}

export function configError(env) {
  const required = ["AUTHENTIK_ISSUER", "AUTHENTIK_CLIENT_ID", "AUTHENTIK_CLIENT_SECRET", "AUTHENTIK_REDIRECT_URI", "SESSION_SECRET"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) return "Missing Pages configuration: " + missing.join(", ");
  if (String(env.SESSION_SECRET).length < 32) return "SESSION_SECRET must contain at least 32 characters."; 
  try {
    if (new URL(env.AUTHENTIK_ISSUER).protocol !== "https:") return "AUTHENTIK_ISSUER must use HTTPS.";
    if (new URL(env.AUTHENTIK_REDIRECT_URI).protocol !== "https:") return "AUTHENTIK_REDIRECT_URI must use HTTPS.";
  } catch {
    return "AUTHENTIK_ISSUER or AUTHENTIK_REDIRECT_URI is not a valid URL.";
  }
  return "";
}

export async function discovery(env) {
  const issuer = issuerUrl(env);
  const response = await fetch(issuer + "/.well-known/openid-configuration", {
    headers: { "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Could not load Autentik OpenID configuration.");
  const metadata = await response.json();
  if (!metadata.issuer || metadata.issuer.replace(/\/+$/, "") !== issuer) {
    throw new Error("Autentik discovery issuer does not match AUTHENTIK_ISSUER.");
  }
  for (const key of ["authorization_endpoint", "token_endpoint", "jwks_uri"]) {
    if (!metadata[key] || new URL(metadata[key]).protocol !== "https:") {
      throw new Error("Autentik discovery document is missing a valid " + key + ".");
    }
  }
  return metadata;
}

export function validJwtClaims(claims, config, nonce) {
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (String(claims.iss || "").replace(/\/+$/, "") !== config.issuer.replace(/\/+$/, "")) return false;
  if (!audiences.includes(config.clientId)) return false;
  if (audiences.length > 1 && claims.azp !== config.clientId) return false;
  if (claims.azp && claims.azp !== config.clientId) return false;
  if (!claims.sub || !Number.isFinite(claims.exp) || claims.exp <= now - 60) return false;
  if (claims.iat && claims.iat > now + 60) return false;
  if (claims.nbf && claims.nbf > now + 60) return false;
  if (claims.nonce !== nonce) return false;
  return true;
}

export async function verifyIdToken(idToken, metadata, config, nonce) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("Autentik returned an invalid ID token.");
  const header = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
  if (header.alg !== "RS256" || !header.kid) throw new Error("Configure the Autentik provider to sign ID tokens with RS256.");
  if (!validJwtClaims(claims, config, nonce)) throw new Error("Autentik ID token validation failed.");

  const jwksResponse = await fetch(metadata.jwks_uri, { headers: { "Accept": "application/json" } });
  if (!jwksResponse.ok) throw new Error("Could not load Autentik signing keys.");
  const jwks = await jwksResponse.json();
  const jwk = Array.isArray(jwks.keys) && jwks.keys.find((key) => key.kid === header.kid && (!key.use || key.use === "sig"));
  if (!jwk) throw new Error("No matching Autentik signing key was found.");
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64url(parts[2]),
    encoder.encode(parts[0] + "." + parts[1])
  );
  if (!valid) throw new Error("Autentik ID token signature is invalid.");
  return claims;
}
