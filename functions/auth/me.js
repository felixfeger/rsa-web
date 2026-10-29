import { getSession, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session || !session.user) return json({ authenticated: false }, 401);
  return json({
    authenticated: true,
    user: {
      name: session.user.name || "",
      email: session.user.email || "",
      preferred_username: session.user.preferred_username || ""
    }
  });
}
