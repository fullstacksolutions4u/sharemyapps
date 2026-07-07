# Email — Admin Bulk Email via Brevo

Admin panel page for composing and sending custom emails to selected users' registered email addresses through Brevo.

## Progress

- [x] Server: `sendAdminCustomEmail` template in `server/utils/email.js` — branded ShareMyApps wrapper (logo header + footer), personalized "Hi {name}," greeting, plain-text body with line breaks preserved, HTML-escaped for safety.
- [x] Server: `getEmailRecipients` + `sendCustomEmail` in `server/controllers/adminController.js`.
- [x] Server: routes in `server/routes/admin.js` (admin-protected via `protect, requireAdmin`):
  - `GET /api/admin/email/users` — lightweight user list (name, email, avatar, regNumber, userType); excludes deleted users and users without email.
  - `POST /api/admin/email/send` — body `{ subject, body, userIds }`; sends via Brevo one-by-one; returns `{ sent, failed: [emails], total }`.
- [x] Client: `client/src/pages/admin/AdminEmailSection.jsx` — Email page with:
  - Subject input + body textarea (compose panel).
  - Recipient picker: search by name/email, filter All / Developers / Clients, select all (filtered), per-user checkboxes with avatar + email.
  - Confirmation prompt before sending; success/failure toasts; failed-email list shown after partial failures.
- [x] Client: registered in `AdminPanel.jsx` sidebar as **Email** (Send icon), section key `email`.
- [x] Verified: client lint + build pass.

## Notes / possible future enhancements

- Uses existing `BREVO_API_KEY` / `EMAIL_FROM` env vars — no new config needed.
- Emails are sent sequentially; large user lists will take a while (no batching/queue yet).
- Body is plain text (HTML-escaped). Rich text / HTML body support could be added later.
- No send-history model yet (unlike Job Alert sessions). Could add an `EmailCampaign` model to log past sends and support re-use.
