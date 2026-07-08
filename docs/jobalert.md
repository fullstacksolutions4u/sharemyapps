# Job Alert — Admin Job Recommendations

Admin panel page ("Job Alert" in the sidebar, section key `job_recommendations`) for sending job opening alerts to premium users who have received their optimized resume & cover letter.

## How it works

1. Admin fills in a list of jobs — each row is a company name (`subject`) and the email id to send the CV to (`emailId`).
   - Optionally, a separate **Career Page Links** section: rows of company name + career-page URL (`careerLinks[] { company, url }`) where users can upload their resume directly. URLs are normalized server-side (`https://` prepended if no protocol). A session is valid with at least one job **or** one link.
2. Admin selects eligible users (only users with a **completed** `ats_compatible_resume_cover_letter_optimization` session that has a delivery link).
3. Send now or schedule for later (`datetime-local`). Each send creates a numbered **session** stored in the `JobAlert` model.
4. On send, each recipient gets:
   - An in-app **Notification** (`type: 'job_alert'`, title "New Job Openings 🎯") linking to the job alert.
   - A Brevo email (`sendJobAlertEmail` in `server/utils/email.js`) pointing them to `/dashboard/job-alerts`.

## Existing pieces

- **Client**: `client/src/pages/admin/AdminJobRecommendationsSection.jsx`
  - Job rows table (default 10 rows, add/remove), user picker, schedule field.
  - Session history with pagination (5 per page): **Reuse** (load companies into the form), **Edit** (only for scheduled, not-yet-sent sessions), **Delete**.
  - User-facing page: `client/src/pages/JobAlerts.jsx` (`/dashboard/job-alerts`).
- **Server** (`server/routes/admin.js`, all behind `protect, requireAdmin`):
  - `GET /api/admin/job-recommendations/premium-users` — eligible users (completed resume/cover-letter delivery, not deleted).
  - `POST /api/admin/job-recommendations/send` — body `{ jobs, userIds, scheduledAt? }`; sends now or stores a scheduled session (`notified: false`).
  - `GET /api/admin/job-recommendations/sessions` — last 50 sessions with jobs, recipients, schedule status.
  - `PUT /api/admin/job-recommendations/sessions/:id` — modify a scheduled (not yet sent) session; 409 if already sent.
  - `DELETE /api/admin/job-recommendations/sessions/:id` — delete/cancel a session.
- **Model**: `server/models/JobAlert.js` — `jobs[] { emailId, subject }`, `careerLinks[] { company, url }`, `recipients[]`, `sentBy`, `scheduledAt`, `notified`, `sessionNumber`.

## Notes

- Scheduled sessions (`notified: false`) are processed by `server/jobs/jobAlertScheduler.js`, started from `server/index.js`, which fires them once `scheduledAt` is reached.
- Related admin feature: bulk custom emails live on the separate **Email** page — see [email.md](email.md).

## Progress / TODO

- [x] Documented current feature (2026-07-07).
- [x] Career page links (2026-07-07): admin sends optional `careerLinks` (company + career-page URL) alongside jobs; user Job Alerts page shows jobs (company/email) on the left and "Upload Resume" links on the right.
- [x] User page redesign (2026-07-07): no per-session dates/day badges. One global **Day N** badge (days since `eligibleSince`, i.e. resume/cover-letter delivery = Day 1). Two side-by-side containers: jobs table (left), career links with company + Upload Resume button only (right).
- [x] Today-only view (2026-07-07): user page shows only the **latest alert sent today** (user's local date, by `scheduledAt`/`createdAt`); older alerts auto-disappear from the user page at midnight. History is only hidden client-side — DB records and admin session history are untouched.
- [ ] (Add upcoming Job Alert changes here.)
