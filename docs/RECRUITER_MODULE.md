# Recruiter Role Module — Implementation Tracker

> Tracks all planned, in-progress, and completed work for the Recruiter (`userType: 'recruiter'`) role.

---

## Legend

| Status | Meaning |
|--------|---------|
| `[ ]` | Planned |
| `[~]` | In Progress |
| `[x]` | Done |

---

## Current State (baseline — 2026-06-05)

### What exists
- **`RecruiterProfile` component** (`client/src/pages/ClientProfile.jsx`) — company info form (name, website, industry) + contact tab; saves via `PUT /api/auth/profile`.
- **`FindDevelopers` page** (`client/src/pages/FindDevelopers.jsx`) — paste a JD → AI extracts skills → matches developers → saves to `JDSearchHistory`.
- **`FindDevelopersHistory` page** (`client/src/pages/FindDevelopersHistory.jsx`) — past JD searches with matched developer cards.
- **`JDSearchHistory` model** (`server/models/JDSearchHistory.js`) — stores JD text, extracted data, result count, developer snapshot.
- **`jdAnalysis` route** (`server/routes/jdAnalysis.js`) — `POST /api/jd/history`, `GET /api/jd/history`.
- **`SelectRole` page** (`client/src/pages/SelectRole.jsx`) — first-time role picker (developer / client / recruiter).
- **Route guard** — `FindDevelopers` redirects non-recruiter/non-client users.
- **`userType: 'recruiter'`** stored on User model; `companyName`, `companyWebsite`, `industry`, `phone` fields on User.

---

## Completed

### Onboarding & Redirects
- [x] Fix post-login redirect: returning recruiters go to `/find-developers`, not `/client-profile` — fixed in `Login.jsx`, `App.jsx`, `Navbar.jsx`, `authController.js` (2026-06-05)
- [x] Fix post-setup redirect: after first `RecruiterProfile` save, navigate to `/find-developers` — fixed in `ClientProfile.jsx` (2026-06-05)

### Profile
- [x] Expanded industry list from 13 → 38 options in `ClientProfile.jsx` (2026-06-05)

---

## In Progress

### 3. Unified Find Developers Page (AI Animation + Inline Results)

**Goal:** Merge the results experience into the Find Developers page. Remove the forced navigation to the history page after each search. Free up `/find-developers/history` ("Shortlisted Candidates") for future features.

**Page states:**
- `idle` — JD input + last 3 recent searches shown as clickable cards
- `loading` — multi-step AI progress animation
- `results` — extracted tags + developer table animates in (no page change)

**Files to change:**

| Action | File | What changes |
|--------|------|-------------|
| CREATE | `client/src/components/recruiter/DevelopersTable.jsx` | Extract `DevelopersTable`, `Avatar`, `toAbs`, `timeAgo`, `vacancyTitle` from history page into a shared component; add optional `stagger` prop for animation |
| EDIT | `client/src/pages/FindDevelopers.jsx` | Full refactor — new state machine, inline results, loading animation, recent searches section; remove `navigate` to history |
| EDIT | `client/src/pages/FindDevelopersHistory.jsx` | Import shared component, remove extracted definitions — no behavioral changes |
| EDIT | `client/src/index.css` | Add `@keyframes fade-slide-up` and `@keyframes step-tick` + utility classes |

**Loading animation (4 steps, Tailwind only):**
1. Reading job description
2. Extracting skills & roles
3. Matching developers
4. Ranking results

Steps tick every 700ms using a `useRef` interval (avoids stale-closure). Steps 1–3 auto-advance; step 4 holds until the API responds. Each active step uses `animate-step-tick` with a remounted `key` so the CSS animation re-fires per step.

**Results reveal (stagger animation):**
- Extracted skill/role/level chips fade-slide-up first (60ms delay per chip)
- Developer table rows stagger in after chips (60ms per row, offset by chip count)
- Gated by `resultsReady` boolean that flips `true` one tick after state is set (standard mount-then-animate pattern)

**Recent searches (idle state):**
- Loads last 3 history items via `GET /api/jd/history` on mount
- Each card shows `vacancyTitle`, `timeAgo`, skill chips, candidate count
- Clicking a card restores `developers` + `extracted` from stored data — no new AI call, triggers instant results reveal

- [x] Extract `DevelopersTable` shared component → `client/src/components/recruiter/DevelopersTable.jsx`
- [x] Add CSS keyframes to `index.css` (`fade-slide-up`, `step-tick`)
- [x] Refactor `FindDevelopers.jsx` — state machine + loading animation + recent searches
- [x] Update `FindDevelopersHistory.jsx` imports
- [ ] Manual test: full search flow, error flow, recent card click, history page unchanged

---

## Planned Improvements

### 1. Onboarding & Profile
- [ ] Add avatar/logo upload to recruiter profile
- [ ] Add `position` / `jobTitle` field to recruiter profile (e.g. "Head of Engineering")
- [ ] Validate `companyWebsite` format (auto-prefix `https://` if missing)
- [ ] Show profile completion progress bar on first visit

### 2. Recruiter Dashboard
- [ ] Create `/recruiter-dashboard` page (dedicated landing after login)
- [ ] Summary cards: total JD searches, saved developers, active vacancies
- [ ] Quick-access links: Find Developers, My Vacancies, Saved Developers, Messages
- [ ] Recent activity feed (last 5 searches, last messages)

### 3. Find Developers — Follow-on
- [ ] Save / bookmark individual developer cards from inline results
- [ ] Show developer availability status on result cards
- [ ] Re-run a past search with one click (from recent cards)

### 4. Saved Developers
- [ ] `SavedDeveloper` model — `recruiter` ref + `developer` ref + optional note + `savedAt`
- [ ] `POST /api/users/saved-developers`, `DELETE`, `GET` endpoints
- [ ] `/saved-developers` page — grid of bookmarked developer cards with notes

### 5. Shortlisted Candidates page (repurposed)
- [ ] Decide new purpose for `/find-developers/history` route — candidates for: full search history with filters, saved developers list, or vacancy-linked candidate pipeline
- [ ] Update nav link label once new purpose is decided

### 6. Messaging
- [ ] Add "Message" CTA button on developer result cards (recruiter only)
- [ ] Pre-fill message composer with recruiter company name context
- [ ] Show recruiter company name in message thread header (developer side)
- [ ] Unread message badge in recruiter nav

### 7. Vacancy Posting
- [ ] Link `Vacancy` model to recruiter user (`postedBy` field)
- [ ] Allow recruiters to post, edit, and close vacancies from their profile/dashboard
- [ ] Show recruiter's active vacancies on their public profile

### 8. Recruiter Public Profile
- [ ] `/recruiter/:userId` public page — company info, open vacancies, posted opportunities
- [ ] Recruiter visibility toggle (public / private)

### 9. Admin Panel
- [ ] Add recruiter tab — list of all recruiter accounts with JD search counts
- [ ] Ability to suspend / verify recruiter accounts

---

## Notes

- Recruiters and clients share `ClientProfile.jsx` — recruiter renders `RecruiterProfile`, client renders `ClientFreelanceProfile`. Keep this split clean.
- `JDSearchHistory` stores a developer snapshot — never re-query live developer data from history views; use the stored `developers` array.
- All recruiter API routes must include `protect` middleware and a `userType === 'recruiter'` guard.
- The `DevelopersTable` shared component must remain a pure display component (no data fetching) so it works in both the inline results and the history expand panels.
- Update this file alongside each change.
