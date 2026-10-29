import { clearCookie, redirect, SESSION_COOKIE } from "../_lib/auth.js";

export async function onRequestGet({ request }) {
  return redirect(new URL("/", request.url).toString(), [clearCookie(SESSION_COOKIE)]);
}
