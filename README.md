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

The application pages link to hosted Autentik sign-in at `https://login.republicstates.xyz`. The link does not establish an OIDC callback or gate form submissions; a full login session needs an Autentik OAuth2/OIDC application and client configuration.

## Emergency page

Edit `emergency-data.js` to update `emergency.html`.

- Set `noCurrentEmergencies: true` to display "No current emergencies."
- Set `noCurrentEmergencies: false` and edit the `emergencies` list to display active alerts.
