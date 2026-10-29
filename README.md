# Republic States of America Website

Static multi-page website for the fictional Republic States of America government portal.

## Pages

- `index.html`
- `services.html`
- `visiting.html`
- `about.html`
- `official-websites.html`
- `cbp.html`
- `emergency.html`
- `contact.html`
- `search.html`
- `citizenship.html`
- `greencard.html`
- `passport.html`

## Contact and application backend

The Pages Functions in `functions/api/contact.js` and `functions/api/application.js` handle form submissions on the same site at `/api/contact` and `/api/application`. They send contact messages and allowlisted application survey responses through Resend to `hello@felixfeger.com`. Application forms collect a name, email address, and survey answers only.

Set the following Cloudflare Pages project secret:

- `RESEND_API_KEY`

Optionally set `MAIL_FROM` to a sender address verified in Resend. If omitted, the functions use the configured default sender. Set variables/secrets for both Production and Preview if you use both.

The application pages use an Autentik OIDC authorization-code flow with PKCE. Pages Functions validate the ID token signature, issuer, audience, nonce, and state, then issue a signed HTTP-only session cookie. Application submissions require a valid session and use the authenticated profile's name and email. Autentik login credentials are never handled by this site.

Configure the following Cloudflare Pages project values for both Production and Preview. Register the exact callback URL in Authentik for each hostname:

- `AUTHENTIK_ISSUER` (for example, `https://login.republicstates.xyz/application/o/rsa-web/`)
- `AUTHENTIK_CLIENT_ID`
- `AUTHENTIK_REDIRECT_URI` (optional; if omitted, Pages uses the current HTTPS hostname plus `/auth/callback`)
- `AUTHENTIK_CLIENT_SECRET` as an encrypted secret using the provider's `client_secret_basic` method
- `SESSION_SECRET` as an encrypted, random secret of at least 32 bytes
- `RESEND_API_KEY` as an encrypted secret
- `MAIL_FROM` is optional; if set, it must be a sender verified in Resend

In Authentik, enable Authorization Code, select an RSA signing key using RS256, allow the exact callback URL, and provide `openid`, `email`, and `profile` scope mappings. The site requires Authentik to return the user's name and email.

## Emergency page

Edit `emergency-data.js` to update `emergency.html`.

- Set `noCurrentEmergencies: true` to display "No current emergencies."
- Set `noCurrentEmergencies: false` and edit the `emergencies` list to display active alerts.
