export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/request-otp" && request.method === "POST") {
      const { email } = await request.json();
      if (!email || !email.includes("@")) {
        return cors(json({ error: "A valid email is required." }, 400));
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await env.OTP_CODES.put(email.toLowerCase(), code, { expirationTtl: 600 });

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.MAIL_FROM,
          to: email,
          subject: "Your Republic States verification code",
          text: `Your Republic States Government verification code is ${code}. It expires in 10 minutes.`
        })
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send OTP email." }, 502));
      }

      return cors(json({ ok: true }));
    }

    if (url.pathname === "/contact" && request.method === "POST") {
      const body = await request.json();
      const email = String(body.email || "").toLowerCase();
      const expected = await env.OTP_CODES.get(email);

      if (!expected || expected !== String(body.otp || "")) {
        return cors(json({ error: "Invalid or expired OTP code." }, 401));
      }

      await env.OTP_CODES.delete(email);

      const message = [
        `Name: ${body.name || ""}`,
        `Email: ${body.email || ""}`,
        `Topic: ${body.topic || ""}`,
        "",
        body.message || ""
      ].join("\n");

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.MAIL_FROM,
          to: env.CONTACT_TO,
          reply_to: body.email,
          subject: `RSA contact: ${body.topic || "Website message"}`,
          text: message
        })
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send contact message." }, 502));
      }

      return cors(json({ ok: true }));
    }

    return cors(json({ error: "Not found." }, 404));
  }
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
