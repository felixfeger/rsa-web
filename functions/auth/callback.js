import {
  STATE_COOKIE,
  SESSION_COOKIE,
  clearCookie,
  configError,
  cookie,
  decodeBase64url,
  discovery,
  json,
  readCookie,
  redirect,
  safeReturnTo,
  signPayload,
  verifyIdToken,
  verifyPayload
} from "../_lib/auth.js";

const encoder = new TextEncoder();

export async function onRequestGet({ request, env }) {
  const error = configError(env);
  if (error) return json({ error }, 500);

  const url = new URL(request.url);
  const stateCookie = readCookie(request, STATE_COOKIE);
  const state = await verifyPayload(stateCookie, env.SESSION_SECRET, "oidc_state");
  if (!state || !url.searchParams.get("state") || url.searchParams.get("state") !== state.state) {
    return failureResponse("/", url.origin);
  }

  if (url.searchParams.get("error")) return redirectWithState(state.returnTo, url.origin);

  const code = url.searchParams.get("code");
  if (!code) return redirectWithState(state.returnTo, url.origin);

  try {
    const metadata = await discovery(env);
    const credentials = btoa(String.fromCharCode(...encoder.encode(env.AUTHENTIK_CLIENT_ID + ":" + env.AUTHENTIK_CLIENT_SECRET)));
    const tokenResponse = await fetch(metadata.token_endpoint, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.AUTHENTIK_REDIRECT_URI,
        code_verifier: state.verifier
      })
    });
    const tokens = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokens.id_token) {
      throw new Error("Autentik could not exchange the authorization code. Check the client authentication method and redirect URI.");
    }

    const config = { issuer: env.AUTHENTIK_ISSUER, clientId: env.AUTHENTIK_CLIENT_ID };
    const claims = await verifyIdToken(tokens.id_token, metadata, config, state.nonce);
    let user = {
      sub: String(claims.sub),
      name: String(claims.name || claims.preferred_username || ""),
      email: String(claims.email || ""),
      preferred_username: String(claims.preferred_username || "")
    };

    if (tokens.access_token && metadata.userinfo_endpoint) {
      const userInfoResponse = await fetch(metadata.userinfo_endpoint, {
        headers: { "Authorization": "Bearer " + tokens.access_token, "Accept": "application/json" }
      });
      if (userInfoResponse.ok) {
        const profile = await userInfoResponse.json();
        if (profile.sub !== claims.sub) throw new Error("Autentik user information subject did not match the ID token.");
        user = {
          sub: String(profile.sub),
          name: String(profile.name || profile.preferred_username || user.name),
          email: String(profile.email || user.email),
          preferred_username: String(profile.preferred_username || user.preferred_username)
        };
      }
    }

    if (!user.name || !user.email) throw new Error("Autentik must return name and email claims. Check the profile and email scope mappings.");

    const now = Math.floor(Date.now() / 1000);
    const session = await signPayload({
      purpose: "app_session",
      user,
      iat: now,
      exp: now + 4 * 60 * 60
    }, env.SESSION_SECRET);
    return redirect(new URL(safeReturnTo(state.returnTo), url.origin).toString(), [
      cookie(SESSION_COOKIE, session, 4 * 60 * 60),
      clearCookie(STATE_COOKIE)
    ]);
  } catch (error) {
    console.error("Autentik callback failed:", error.message || "unknown error");
    return redirectWithState(state.returnTo, url.origin);
  }
}

function redirectWithState(path, origin) {
  const target = new URL(safeReturnTo(path), origin);
  target.searchParams.set("auth_error", "1");
  return redirect(target.toString(), [clearCookie(STATE_COOKIE)]);
}

function failureResponse(path, origin) {
  const target = new URL(safeReturnTo(path), origin);
  target.searchParams.set("auth_error", "1");
  return redirect(target.toString(), [clearCookie(STATE_COOKIE)]);
}
