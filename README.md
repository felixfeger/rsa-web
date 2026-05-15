# Republic States of America Website

Static multi-page website for the fictional Republic States of America government portal.

## Pages

- `index.html`
- `services.html`
- `visiting.html`
- `about.html`
- `official-websites.html`
- `contact.html`
- `search.html`

## Contact OTP backend

`cloudflare-worker.js` contains a Cloudflare Worker that sends OTP codes and contact emails through Resend.

Required Worker bindings and secrets:

- `RESEND_API_KEY`
- `MAIL_FROM`
- `CONTACT_TO`
- `OTP_CODES`, a Cloudflare KV namespace

After deploying the Worker, replace `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` in `contact.html` with the Worker URL.
