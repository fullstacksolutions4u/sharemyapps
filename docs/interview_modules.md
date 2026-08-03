# Interview Modules

> **Maintained doc:** Update this file whenever Interview Modules behavior, APIs, schemas, or UI flows change. Agents should read it for context before implementing related work.

Admin feature for running structured technical interviews: manage a question bank (modules → topics → questions), evaluate screening applicants live, and persist results as `InterviewSession` records that can later be shared with developers.

## Purpose

1. **Question bank** — Independent copy of interview content (can be seeded from Quiz Zone / Learning Modules).
2. **Live evaluation** — Interviewer picks a contacted (screening) applicant, opens topics, marks answers correct/incorrect with comments.
3. **Session history** — Saved evaluations become interview sessions listing score, questions, and interviewer.
4. **Downstream use** — Sessions also power Interview Screening (curation drawer), recruiter showcase pages (shared sessions), and developer-facing feedback.

Admin entry point: **Admin Panel → Interview Screening → Interview Modules** tab (`curation` section in `client/src/pages/AdminPanel.jsx`).

UI component: `client/src/pages/admin/AdminInterviewModulesSection.jsx`, rendered as a tab inside `AdminCurationSection.jsx`.

---

## Architecture Overview

```
InterviewModule (question bank)
  └── topics[]
        └── quizzes[] / questions

Admin evaluates applicant ──► InterviewSession
                                ├── mcqAssessments[] (snapshot of Q&A results)
                                ├── overallRating, headline, summary, tips, …
                                └── sharedWithCandidate → developer feedback + email
```

Lives under **Interview Screening** (`AdminCurationSection.jsx`), which also has applicant session / sessions-history tabs and the richer evaluation drawer (Meet link, sections, AI summarize, share). All paths write to the same `InterviewSession` collection.

---

## Data Models

### `InterviewModule` — `server/models/InterviewModule.js`

| Field | Type | Notes |
|-------|------|--------|
| `title` | String | Required, max 200 |
| `category` | String | Optional label (UI also derives category from title keywords) |
| `order` | Number | Sort order |
| `isActive` | Boolean | Default `true`; list endpoint only returns active |
| `topics[]` | embedded | See below |
| timestamps | createdAt / updatedAt | |

**Topic subdocument**

| Field | Type | Notes |
|-------|------|--------|
| `name` | String | Required |
| `completed` | Boolean | Default `false` |
| `order` | Number | |
| `isPracticalProblem` | Boolean | If true, show `problemUrl` (e.g. LeetCode) |
| `problemUrl` | String | |
| `quizzes[]` | embedded questions | See below |
| timestamps | per topic | |

**Question / quiz subdocument** (`topic.quizzes[]`)

| Field | Type | Notes |
|-------|------|--------|
| `question` | String | Required |
| `questionCode` | String | Optional code snippet for the prompt |
| `answer` | String | Expected answer / interviewer guide |
| `explanation` | String | Often mirrored with `answer` |
| `sampleCode` | String | Optional |
| `options` | [String] | Kept when copied from Quiz Zone MCQs |
| `correctAnswer` | Number | Index into `options` (Quiz Zone legacy) |

List API strips full `quizzes` and returns `hasQuiz` + `quizCount` instead (lazy-load questions on expand).

### `InterviewSession` — `server/models/InterviewSession.js`

| Field | Type | Notes |
|-------|------|--------|
| `user` | ObjectId → User | Candidate |
| `evaluatedBy` | ObjectId → User | Interviewer (admin) |
| `vacancy` | ObjectId → Vacancy | Optional job this session is for (set from Interview Session job dropdown) |
| `sessionNumber` | Number | Auto-incremented **per user** on create |
| `overallRating` | Number 1–10 | Default 5 |
| `headline` / `summary` | String | |
| `googleMeetLink` | String | Used heavily in Interview Screening UI |
| `status` | enum | `scheduled` \| `postponed` \| `cancelled` \| `completed` |
| `sections[]` | `{ title, rating 1–5, notes }` | Skill/soft-skill breakdown |
| `pros` / `cons` | [String] | |
| `improvementTips[]` | `{ area, tip, resourceUrl }` | Shared with developer when session is shared |
| `mcqAssessments[]` | See below | Snapshot from module Q&A |
| `sharedWithCandidate` | Boolean | Default `false` |
| `sharedWithCandidateAt` | Date | |
| `interviewedAt` | Date | Default now |
| timestamps | | |

**`mcqAssessments[]` item**

| Field | Type |
|-------|------|
| `question` | String |
| `options` | [String] |
| `correctAnswerIndex` | Number |
| `isCorrect` | Boolean |
| `comment` | String |
| `moduleTitle` | String |
| `topicName` | String |

Indexes: `{ user, createdAt }`, `{ evaluatedBy, createdAt }`, `{ interviewedAt }`.

---

## API Endpoints

### Interview Modules — `/api/interview-modules`

Mounted in `server/index.js`. All routes: `protect` + `requireAdmin`.  
Controller: `server/controllers/interviewModuleController.js`.  
Router: `server/routes/interviewModules.js`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List active modules; topics omit `quizzes`, include `hasQuiz`, `quizCount` |
| `GET` | `/:id` | Full module including quizzes |
| `POST` | `/` | Create module `{ title, category?, topics?, order? }` |
| `PUT` | `/:id` | Update module fields |
| `DELETE` | `/:id` | Hard delete module |
| `PUT` | `/reorder` | Body `{ modules: [{ _id, order }] }` |
| `POST` | `/copy-from-quiz-zone` | Seed from `LearningModule` (only if Interview Modules empty) |
| `POST` | `/:id/topics` | Add topic `{ name, order?, isPracticalProblem?, problemUrl?, quizzes? }` |
| `PUT` | `/:id/topics/:topicId` | Update topic (clearing `isPracticalProblem` clears `problemUrl`) |
| `DELETE` | `/:id/topics/:topicId` | Remove topic |
| `GET` | `/:moduleId/topics/:topicId/quizzes` | Lazy-load questions for a topic |

**List response shape**

```json
{ "success": true, "data": [ /* modules */ ], "count": N }
```

### Interview Sessions — `/api/admin/interviews`

Behind admin router (`server/routes/admin.js`). Controller: `server/controllers/interviewController.js`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/interviews` | List sessions; query: `userId`, `vacancyId`, `date`, `minRating`, `maxRating`, `shared`, `page`, `limit` |
| `GET` | `/admin/interviews/user/:userId` | All sessions for one developer |
| `POST` | `/admin/interviews/user/:userId` | Create session (sets `evaluatedBy` = admin, bumps `sessionNumber`) |
| `PUT` | `/admin/interviews/:sessionId` | Update session fields |
| `DELETE` | `/admin/interviews/:sessionId` | Delete session |
| `PATCH` | `/admin/interviews/:sessionId/share` | Mark shared; create `interview_feedback` notification; send email |
| `POST` | `/admin/interviews/summarize` | AI summary from `mcqAssessments` (requires `OPENAI_API_KEY`) |

**Create body (relevant to Interview Modules save)**

```json
{
  "mcqAssessments": [
    {
      "question": "...",
      "isCorrect": true,
      "comment": "...",
      "moduleTitle": "JavaScript Fundamentals",
      "topicName": "Closures"
    }
  ],
  "status": "completed",
  "overallRating": 5,
  "vacancy": "<VacancyId or null>"
}
```

Interview Modules UI posts a minimal payload (`mcqAssessments`, `status`, `overallRating: 5`, optional `vacancy`). The Interview Screening drawer posts the full evaluation form.

### Developer feedback — `/api/interview-feedback`

Mounted in `server/index.js` with `protect` only (any authenticated user).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/interview-feedback` | Current user’s sessions where `sharedWithCandidate: true` |

UI: `client/src/pages/DeveloperInterviewFeedback.jsx` (Dashboard nav item **Interview Feedback**, route `/interview-feedback`).

### Applicant / job source (Interview Session tab)

Jobs:

```
GET /api/admin/vacancies
```

Returns all vacancies with populated `interests` and `applicantStatus`. The Session tab lists **active** and **closed** jobs (skips `pending`).

Applicants for a selected job are that vacancy’s `interests` whose status for **this job** is one of:

- `contacted`
- `1 round interview`
- `2nd round interview`
- `3rd round interview`

Dropdown shows **name only**. Selecting an applicant navigates to Interview Modules with `initialApplicant` + `initialVacancy`. The **Interview Modules** tab stays disabled until that selection is made.

---

## Admin UI Flows

### Interview Screening page tabs (`AdminCurationSection.jsx`)

1. **Interview Session** — pick a **job** (active + closed vacancies), then a **screening applicant** for that job (contacted / interview-round statuses). Selecting an applicant opens **Interview Modules** with applicant + job context.
2. **Interview Modules** — locked until a job + applicant are chosen on Interview Session; then embeds `AdminInterviewModulesSection` (question bank + live Q&A). Uses `initialApplicant` + `initialVacancy`. Saves sessions with optional `vacancy` ref.
3. **Interview Sessions** — list of all saved sessions (shows linked job when present; search / refresh / open → Modules).

There is no separate sidebar item for Interview Modules.

### Interview Modules content (`AdminInterviewModulesSection.jsx`)

No inner tabs — question bank + live evaluation only. Session history lives on Screening → **Interview Sessions**.

Shows a read-only context bar (applicant + job from Session tab), **AI evaluation** icon (sparkles) beside the name, **Save Session**, and a pinned **Evaluation Module** panel for overall rating, headline, interviewer comments, section ratings (1–5), and AI-filled summary/pros/cons.

### AI evaluation

1. Interviewer marks questions Correct/Incorrect and adds comments (optional interviewer notes in Evaluation Module).
2. Click the sparkles icon next to the applicant name.
3. `POST /admin/interviews/summarize` with `mcqAssessments`, `candidateName`, optional `interviewerComments`.
4. Response fills Evaluation Module: `headline`, `summary`, `overallRating`, `pros`, `cons`, `improvementTips`.
5. **Save Session** persists Q&A assessments + Evaluation Module fields onto `InterviewSession`.

Requires `OPENAI_API_KEY` on the server.

### Modules — live session flow

1. Load applicant + job from Interview Session tab (`initialApplicant` / `initialVacancy`).
2. Expand category → module → topic; questions load via `GET .../quizzes`.
3. Mark each question **Correct** or **Incorrect** (optional comment). Local `evaluations` map keyed `topicId_questionIndex` with `result: 'correct'|'incorrect'|null`.
4. **Save Session** builds `mcqAssessments` from marked questions + module/topic titles, then `POST /admin/interviews/user/:userId` (includes `vacancy`). Clears local evaluations on success.

### Module / topic CRUD

- **New Module**, edit/delete module.
- **Add Topic**: bulk names (one per line), single topic + questions, or practical problem (+ URL).
- **Edit Topic**: name, practical flag, full question editor (`TopicQuestionsForm`).
- Categories in UI (`CATEGORY_DEFS`) are **client-side** groupings by title/keyword (Frontend, Backend, Database, Programming, DSA, Mobile, System Design, AI, Others) — not a required DB enum. Matching uses **longest keyword wins** so titles like “React Native” classify under Mobile (not Frontend’s “react”).

### Copy from Quiz Zone

`POST /api/interview-modules/copy-from-quiz-zone`

- Allowed only when `InterviewModule` count is **0**.
- Copies active `LearningModule` docs into `InterviewModule`.
- MCQ options are rewritten into a text `answer` block (`Correct Option: A. …` + all options + explanation) for interviewer use.
- Independent data afterward — edits do not affect Quiz Zone.

---

## Relation to Interview Screening

Interview Modules is a **tab inside Interview Screening**, not a separate admin nav item.

| Concern | Interview Modules tab | Screening Session / Sessions tabs |
|---------|----------------------|-----------------------------------|
| Primary job | Question bank + live Q&A ticks | Applicant pick + full eval drawer / session list |
| Applicant pick | From Session tab only (read-only context bar) | Job → screening applicants |
| Saves to | `InterviewSession` | Same |
| Uses modules | Yes (evaluate from bank) | Drawer also loads modules for MCQ tool |
| Share / email / AI summarize | History is read-focused; share lives in Screening drawer | `PATCH .../share`, `POST .../summarize` |

Showcase pages (`showcaseController`) attach the latest **shared** session per candidate for recruiter views.

---

## Developer-facing feedback

1. Admin shares a session (`sharedWithCandidate: true`).
2. In-app notification type `interview_feedback`.
3. Email via `sendInterviewTipsEmail` (`server/utils/email.js`).
4. Developer opens Dashboard → **Interview Feedback** → `GET /interview-feedback` (shared sessions only): rating, headline/summary, tips, section scores, pros/cons.

---

## Business Rules

- Session `sessionNumber` increments per candidate, not globally.
- Sessions may link to a `vacancy` for per-job tracking.
- List modules: only `isActive: true`.
- Copy from Quiz Zone: one-shot seed when empty.
- Interview Session applicants: per selected job, status in contacted / interview rounds.
- Sharing is explicit; unshared sessions are invisible to the developer API.
- Session statuses: `scheduled` | `postponed` | `cancelled` | `completed`.
- AI summarize needs `OPENAI_API_KEY` (used from Screening drawer, not the Modules save button).

---

## Key File Map

| Path | Role |
|------|------|
| `server/models/InterviewModule.js` | Module / topic / question schema |
| `server/models/InterviewSession.js` | Evaluation session schema |
| `server/controllers/interviewModuleController.js` | Module CRUD + copy from Quiz Zone |
| `server/controllers/interviewController.js` | Session CRUD, share, AI summarize, my feedback |
| `server/routes/interviewModules.js` | `/api/interview-modules` |
| `server/routes/admin.js` | `/api/admin/interviews/*` |
| `server/index.js` | Mounts modules + interview-feedback |
| `client/src/pages/admin/AdminInterviewModulesSection.jsx` | Modules UI (embedded as Screening tab) |
| `client/src/pages/admin/AdminCurationSection.jsx` | Interview Screening host (Session / Modules / Sessions tabs) |
| `client/src/pages/DeveloperInterviewFeedback.jsx` | Developer shared feedback |
| `client/src/pages/AdminPanel.jsx` | Sidebar → Interview Screening only (`curation`) |
| `server/scripts/addMockInterviewFeature.js` | Adds “Technical Mock Interviews” to premium plan features (billing copy, not core logic) |

---

## Typical Interviewer Workflow

1. Mark applicants as **contacted** (or interview round) on the job under Opportunities.
2. Open **Admin → Interview Screening → Interview Session**.
3. Choose a **job**, then an **applicant** for that job (redirects to **Interview Modules** with both selected).
4. Expand topics, tick correct / add comments, then **Save Session** (stored with `vacancy` ref).
5. Review under Screening → **Interview Sessions** (job title shown when linked).
6. Use the evaluation drawer when needed to enrich rating/tips and **Share** feedback.
