import { clearCookie, SESSION_COOKIE } from "../_lib/auth.js";

export async function onRequestGet({ request }) {
  const response = Response.redirect(new URL("/", request.url).toString(), 302);
  response.headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
