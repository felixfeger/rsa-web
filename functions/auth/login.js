import {
  configError,
  cookie,
  discovery,
  json,
  randomToken,
  safeReturnTo,
  signPayload
} from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const error = configError(env);
  if (error) return json({ error }, 500);

  try {
    const metadata = await discovery(env);
    const url = new URL(request.url);
    const state = randomToken(32);
    const nonce = randomToken(32);
    const verifier = randomToken(48);
    const challenge = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.AUTHENTIK_CLIENT_ID,
      redirect_uri: env.AUTHENTIK_REDIRECT_URI,
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: (await import("../_lib/auth.js")).base64url(challenge),
      code_challenge_method: "S256"
    });
    const returnTo = safeReturnTo(url.searchParams.get("return_to") || "/");
    const stateCookie = await signPayload({
      purpose: "oidc_state",
      state,
      nonce,
      verifier,
      returnTo,
      exp: Math.floor(Date.now() / 1000) + 600
    }, env.SESSION_SECRET);
    const response = Response.redirect(metadata.authorization_endpoint + "?" + params.toString(), 302);
    response.headers.append("Set-Cookie", cookie("__Host-rsa_oidc_state", stateCookie, 600));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return json({ error: error.message || "Could not start Autentik sign-in." }, 502);
  }
}
