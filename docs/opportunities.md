# Opportunities

> **Maintained doc:** Update this file whenever Opportunities / Vacancies / Freelance behavior, APIs, schemas, or UI flows change. Agents should read it for context before implementing related work.

Admin + developer surfaces for job vacancies, reported openings, freelance projects, and community **Job Post Links**. Interview Screening reuses vacancy applicant statuses (`contacted` / interview rounds) to pick candidates per job.

## Purpose

1. **Admin posts & manages vacancies** — create/edit/close jobs, review applicants, update pipeline status, reply to applicants.
2. **Developers discover & apply** — browse opportunities, show interest (apply), track application progress.
3. **Users can report openings** — community-submitted vacancies land in `pending` until admin reviews.
4. **Freelance projects** — separate opportunity type under the same admin Opportunities section.
5. **Job Post Links** — community-shared external job URLs; gated Apply Now (2 free per week + weekly contribution unlock).
6. **Feeds Interview Screening** — applicants marked `contacted` (or interview rounds) on a vacancy appear in Screening’s job → applicant dropdowns.

Admin entry: **Admin Panel → Opportunities** (`opportunities` in `client/src/pages/AdminPanel.jsx`). Job Post Links admin UI: `AdminJobLinksSection` (Job Links / related admin nav).

Public/user: `/opportunities` and `/vacancies` → `Vacancies.jsx` (tabs: Job Post Links / Our Client Vacancies / Freelance); dashboard **Applications** → `Applications.jsx`.

---

## Architecture Overview

```
Vacancy
  ├── interests[]          → current applicants (User refs)
  ├── everApplied[]       → historical applicants
  ├── applicantStatus     → Map userId → status string
  └── applicantStatusHistory → Map userId → [{ status, note, date }]

JobLink (Job Post Links)
  ├── status              → pending | approved | rejected
  ├── approvedAt          → set when admin approves (weekly unlock window)
  ├── clicks[]            → users who clicked Apply Now
  └── createdBy           → contributor

FreelanceOpportunity
  └── interests[]          → User refs (simpler; no status pipeline)

Public Opportunities tabs (Vacancies.jsx)
  ├── Job Post Links
  ├── Our Client Vacancies
  └── Freelance Projects

Developer
  ├── Browse / Apply Now (job links — gated) or interest (vacancies/freelance)
  └── Applications stepper (client vacancies status + interview sessions)
```

---

## Data Models

### `Vacancy` — `server/models/Vacancy.js`

| Field | Type | Notes |
|-------|------|--------|
| `title` | String | Required |
| `company` | String | |
| `description` | String | Required |
| `skills` | [String] | |
| `location` | String | |
| `type` | enum | `remote` \| `onsite` \| `hybrid` (default `remote`) |
| `industry` | String | |
| `jobType` | enum | `''` \| `Full-time` \| `Part-time` \| `Freelance` \| `Contract` \| `Internship` |
| `experience` | enum | `''` \| `Fresher` \| `0-1 years` \| … \| `8+ years` |
| `salaryRange` | String | Free text |
| `status` | enum | `active` \| `closed` \| `pending` (default `active`) |
| `isViewed` | Boolean | Used for reported/pending badge clearing |
| `createdBy` | ObjectId → User | Admin or reporting user |
| `interests` | [ObjectId → User] | Current applicants |
| `everApplied` | [ObjectId → User] | First-time apply tracking |
| `applicantStatus` | Map\<String, String\> | Per-user pipeline status |
| `applicantStatusHistory` | Map of `[{ status, note, date }]` | Audit trail |
| timestamps | | |

Indexes: `{ status, createdAt }`, `{ createdBy }`.

### Applicant status values (pipeline)

Used in admin UI (`AdminVacanciesSection`) and Applications stepper:

| Status | Meaning |
|--------|---------|
| `applied` | Default on first apply (history entry) |
| `reviewing` | Under review (triggers reviewing email) |
| `contacted` | Screening pool for Interview Screening |
| `1 round interview` | Interview pipeline |
| `2nd round interview` | |
| `3rd round interview` | |
| `selected` | Hired / selected |
| `rejected` | Shown to user as “Not Selected This Time” |

Interview Screening Session tab treats as screening applicants: `contacted`, `1 round interview`, `2nd round interview`, `3rd round interview`.

### `FreelanceOpportunity` — `server/models/FreelanceOpportunity.js`

| Field | Type | Notes |
|-------|------|--------|
| `title` / `description` | String | Required |
| `skills` | [String] | |
| `budget` / `duration` | String | |
| `type` | enum | `remote` \| `onsite` \| `hybrid` |
| `status` | enum | `active` \| `closed` |
| `createdBy` | ObjectId → User | |
| `interests` | [ObjectId → User] | No applicantStatus map |

### Related (not under Opportunities tabs)

- **MentorshipOpportunity** — separate admin Mentorship section (`/api/admin/mentorship*`). Documented here only as sibling “opportunity” naming.

### `JobLink` — `server/models/JobLink.js`

| Field | Type | Notes |
|-------|------|--------|
| `title` / `company` / `url` | String | `url` required |
| `platform` | enum | `linkedin` \| `glassdoor` \| `indeed` \| `naukri` \| `other` |
| `status` | enum | `pending` \| `approved` \| `rejected` \| `access_granted` (default `pending`) |
| `workMode` / `location` / `experience` / `state` | String | Enrichment fields |
| `postedDate` | String | Display string (e.g. `August 03`) |
| `adminNote` | String | Shown on rejection email |
| `expiresAt` | Date | TTL index; set on **approve** (listed links) |
| `approvedAt` | Date | Set on `approved` or `access_granted` (weekly unlock window) |
| `clicks` | [ObjectId → User] | Users who used Apply Now (admin list) |
| `clickEvents` | `[{ user, at }]` | Timestamped applies for weekly free-apply gating |
| `createdBy` | ObjectId → User | Contributor (or admin poster) |

Indexes: `{ createdBy, status, approvedAt }`, `{ clicks }`.

**Duplicate URLs are allowed** — multiple users may submit the same job post link. Public Opportunities only lists `status: approved` (one listing per approved doc; use **Allow Access** for duplicate submissions so they are not listed again).

---

## Job Post Links — Apply Now gating

**Product rules**

1. Each user may click **Apply Now** on **2** distinct job links **per week** for free (no contribution required). Week runs **Monday 06:00 → next Monday 06:00 Asia/Kolkata (IST)**.
2. To apply to **additional** links the same week, they must **contribute ≥1 job post URL** that week (to the community).
3. Contribution unlock requires admin **Approve** (`approved` — listed publicly) **or** **Allow Access** (`access_granted` — unlock only, not listed). Pending does not unlock.
4. Once unlocked for the week, they may Apply Now on **multiple** job posts.
5. Re-opening a link they already visited (**Visited**) is always allowed and does not consume a new apply.
6. **Our Client Vacancies** and **Freelance** are unaffected — no contribution gate on interest/apply.
7. Unlock email (`sendJobLinkUnlockedEmail`) is sent **at most once per week** (first Approve / Allow Access after Monday 06:00 IST). Further approvals that week do not re-email.

**Admin actions (pending)**

| Action | Status | Public list | Unlocks applies |
|--------|--------|-------------|-----------------|
| Approve | `approved` | Yes | Yes |
| Allow Access | `access_granted` | No | Yes |
| Reject | `rejected` | No | No |

Pending rows with a URL that already has an `approved` listing show a **Duplicate URL** badge. AI Auto-fill normalizes titles to canonical designations (e.g. ReactJS Developer → React Developer) and validates duplicates against approved listings.

**Eligibility API**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/job-links/apply-eligibility` | protect | Returns `canApplyMore`, `hasWeeklyContribution`, `pendingContribution`, `applyCount`, `clickedIds`, `message` |
| `POST` | `/api/job-links/:id/click` | protect | Records Apply Now; **403** `APPLY_LIMIT` if gated |

**Weekly contribution** = count of `JobLink` where `createdBy = user`, `status ∈ { approved, access_granted }`, and `approvedAt` (fallback `updatedAt` if missing) is **≥ current week start** (Monday 06:00 IST). Free applies use the same week window via `clickEvents.at`.

Unlock email: `User.jobLinkUnlockEmailSentAt` — send only if unset or `< week start`.

**UI** (`Vacancies.jsx` → Job Post Links tab): inline warning in filter row — “Get 2 free applies weekly — share 1 job post to unlock unlimited applies.” Locked cards show “Contribute to unlock”. On contribute submit: toast “Job link submitted! It will appear after admin approval.” (5s).

Weekly free applies are tracked via `JobLink.clickEvents[{ user, at }]`.

---

## API Endpoints

### Public / authenticated — `/api/vacancies`

Mounted in `server/index.js`. Router: `server/routes/vacancies.js`.  
Controller: `server/controllers/vacancyController.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | optionalAuth | List vacancies (`createdBy` set); strips interests maps; adds `interestCount`, `interested`, `applicationStatus` for current user |
| `POST` | `/` | protect | Create vacancy (also used from post-vacancy flow) |
| `POST` | `/report` | protect | Report opening → `status: 'pending'` |
| `POST` | `/:id/interest` | protect | Apply / show interest (active only); first time → `everApplied` + history `applied` + email |
| `DELETE` | `/:id/interest` | protect | Withdraw interest (active only) |

### Admin — `/api/admin/vacancies*`

Behind `protect` + `requireAdmin` on admin router.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/vacancies` | All vacancies; populate `interests`, `createdBy` |
| `POST` | `/admin/vacancies` | Create (admin as `createdBy`) |
| `PUT` | `/admin/vacancies/:id` | Update fields + status |
| `DELETE` | `/admin/vacancies/:id` | Hard delete |
| `PATCH` | `/admin/vacancies/:id/toggle-status` | Toggle `active` ↔ `closed` |
| `PATCH` | `/admin/vacancies/:id/view` | Set `isViewed: true` (reported badge) |
| `POST` | `/admin/vacancies/:id/reply` | In-app notification to an interested user |
| `PATCH` | `/admin/vacancies/:id/applicant-status` | Body: `{ userId \| userIds, status, note? }` — updates map + history; `reviewing` sends email; always notifies |

### Public / authenticated — `/api/freelance`

Router: `server/routes/freelance.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | optionalAuth | Active freelance list; `interested` / `interestCount` when logged in |
| `POST` | `/:id/interest` | protect | Show interest |

### Admin freelance — `/api/admin/freelance*`

Controller: `server/controllers/freelanceOpportunityController.js`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/freelance` | List |
| `POST` | `/admin/freelance` | Create |
| `PUT` | `/admin/freelance/:id` | Update |
| `DELETE` | `/admin/freelance/:id` | Delete |
| `PATCH` | `/admin/freelance/:id/toggle-status` | Toggle status |
| `POST` | `/admin/freelance/:id/reply` | Reply to interest |

---

## Admin UI Flows

### Host — `AdminOpportunitiesSection.jsx`

Tabs:

1. **Vacancies** — `AdminVacanciesSection` with `filterStatus="standard"` (excludes `pending`). “Add Vacancy” via ref.
2. **Reported Vacancies** — same component with `filterStatus="reported"` (`status === 'pending'`). Badge from `stats.pendingVacancies`.
3. **Freelance Projects** — `AdminFreelanceSection`.

Sidebar badge on Opportunities = `stats.pendingVacancies` (pending + unviewed count from admin stats).

### Vacancies management — `AdminVacanciesSection.jsx`

- List cards: title, company, location, type, status toggle, edit/delete, expand applicants.
- **Applicants panel**: checkboxes, bulk status change, per-user status select, WhatsApp/message reply, CV links, premium badge.
- **Status modal**: note required for reject (default rejection copy prefilled).
- **View modal**: for pending reports; marking viewed fires `decrementPendingVacancies` window event.
- Form fields: title, company, location, type, status, industry, jobType, experience, salaryRange, skills, description.

### Developer UI

| Surface | Path / file | Role |
|---------|-------------|------|
| Browse | `/opportunities`, `/vacancies` → `Vacancies.jsx` | List + apply |
| Report | Report modal / report API | Pending vacancy |
| Post | `/post-vacancy` → `AddVacancy.jsx` | Protected create |
| Track | Dashboard → Applications → `Applications.jsx` | Stepper from `applicantStatus` + history + interview sessions |

Applications stepper stages (simplified): Applied → Reviewing → Contacted → Interview Round(s) (from `InterviewSession`s) → Selected / Not Selected.

---

## Side effects & emails

| Event | Effect |
|-------|--------|
| First apply (`showInterest`) | `sendJobApplicationEmail` |
| Status → `reviewing` | `sendApplicationReviewingEmail` |
| Any status change | `Notification` type `vacancy_reply` |
| Admin reply | `Notification` type `vacancy_reply` |
| Report vacancy | Creates `pending` vacancy |
| Job link → `rejected` | `sendJobLinkRejectedEmail` |
| Job link → `approved` or `access_granted` | `sendJobLinkUnlockedEmail` once per Mon 06:00 IST week (`jobLinkUnlockEmailSentAt`) |

Email helpers: `server/utils/email.js`.

---

## Relation to Interview Screening

| Opportunities | Interview Screening |
|---------------|---------------------|
| Job list | Session tab job dropdown (`GET /admin/vacancies`, active + closed) |
| `applicantStatus` on vacancy | Filters screening applicants for that job |
| Mark `contacted` / interview rounds | Candidate appears in Session → Modules flow |
| — | Saved `InterviewSession.vacancy` links session to job |

See also: `docs/interview_modules.md`.

---

## Business Rules

- Public list only includes vacancies with `createdBy` set.
- Apply / withdraw only on `status === 'active'`.
- First apply writes history `applied`; re-apply after withdraw does not re-push `everApplied`.
- `pending` = reported / needs admin review; standard Vacancies tab hides them.
- Toggle status only flips between `active` and `closed` (not pending).
- Applicant status changes are no-ops if status unchanged (no duplicate history).
- Hard delete removes vacancy permanently.
- **Job Post Links:** 2 free Apply per week (Mon 06:00 IST week); further applies require ≥1 `approved` or `access_granted` contribution in the current week. Duplicate URLs allowed; use **Allow Access** so duplicates are not listed. Server enforces on `POST /job-links/:id/click`. Does **not** apply to Our Client Vacancies / Freelance. On **Approve** or **Allow Access**, contributor gets unlock email **once per week**; on **Reject**, `sendJobLinkRejectedEmail`.

---

## Key File Map

| Path | Role |
|------|------|
| `server/models/Vacancy.js` | Vacancy schema |
| `server/models/FreelanceOpportunity.js` | Freelance schema |
| `server/models/JobLink.js` | Job Post Links schema |
| `server/controllers/vacancyController.js` | Public + admin vacancy logic |
| `server/controllers/freelanceOpportunityController.js` | Freelance admin/public logic |
| `server/controllers/jobLinkController.js` | Job links CRUD, clicks, eligibility |
| `server/routes/vacancies.js` | `/api/vacancies` |
| `server/routes/jobLinks.js` | `/api/job-links` |
| `server/routes/admin.js` | `/api/admin/vacancies*`, `/api/admin/freelance*` |
| `client/src/pages/admin/AdminOpportunitiesSection.jsx` | Opportunities tabs host |
| `client/src/pages/admin/AdminVacanciesSection.jsx` | Vacancy CRUD + applicants |
| `client/src/pages/admin/AdminFreelanceSection.jsx` | Freelance admin UI |
| `client/src/pages/admin/AdminJobLinksSection.jsx` | Admin job links approve/reject |
| `client/src/pages/Vacancies.jsx` | Public/user opportunities browse |
| `client/src/pages/Applications.jsx` | Developer application tracker |
| `client/src/pages/AddVacancy.jsx` | Post vacancy |
| `client/src/components/ReportVacancyModal.jsx` | Report opening |
| `client/src/pages/AdminPanel.jsx` | Sidebar → Opportunities |

---

## Typical Admin Workflow

1. **Opportunities → Vacancies → Add Vacancy** (or approve a Reported vacancy).
2. Developers apply from `/opportunities`.
3. Expand applicants → set status (`reviewing` → `contacted` → interview rounds).
4. When `contacted` / interview round: use **Interview Screening** to run modules evaluation for that job.
5. Close vacancy when hiring done; optionally mark Selected / Rejected on applicants.
6. **Job Post Links:** review pending community links → **Approve** (list + unlock + email), **Allow Access** (unlock only + email, for duplicates), or **Reject** (email).

---

## Planned modifications

_Track upcoming Opportunities changes here as they are scoped:_

- (none yet — add bullets when implementing)