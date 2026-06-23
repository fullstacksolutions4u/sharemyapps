# Tick2Test — Learning Tracker Feature

## Overview

Tick2Test is a gamified learning tracker that lets users tick off topics as they study them, track daily/weekly progress, take quizzes to test knowledge, and earn coins and badges.

Originally built in the **full-stack-solutions** project (`/tick2test` route). This document covers the integration into **ShareMyApps**.

---

## Feature Summary

| Area | Details |
|---|---|
| Route | `/tick2test` |
| Auth | Public (first 3 modules); authenticated for the rest |
| Frontend page | `client/src/pages/LearningTracker.jsx` |
| Backend prefix | `/api/learning-modules`, `/api/learning-progress`, `/api/learning-feedback` |

---

## Frontend Components

| File | Purpose |
|---|---|
| `pages/LearningTracker.jsx` | Main page — module slider, weekly tracker, calendar, badges |
| `components/user/TopicQuizModal.jsx` | Modal for per-topic quizzes |
| `components/common/AnimatedCoin.jsx` | Spinning coin animation for point display |
| `components/common/PieChart.jsx` | Circular progress chart for module completion |
| `api/tick2test.js` | All API calls for modules, progress, and feedback |

### Auth Adaptation

ShareMyApps uses `const { user } = useAuth()` where `user` is `null` when unauthenticated. The LearningTracker uses `!!user` as the `isAuthenticated` check (vs `isAuthenticated` boolean from the fss context).

---

## Backend Files

| File | Purpose |
|---|---|
| `server/models/LearningModule.js` | Module schema with embedded topics and quizzes |
| `server/models/LearningProgress.js` | Per-user progress: completed topics, modules, quiz attempts |
| `server/controllers/moduleController.js` | CRUD for modules, topics, and quiz fetching |
| `server/controllers/progressController.js` | Toggle topic/module completion, submit quiz attempts |
| `server/controllers/learningFeedbackController.js` | Create and list feedback messages |
| `server/routes/modules.js` | Routes mounted at `/api/learning-modules` |
| `server/routes/learningProgress.js` | Routes mounted at `/api/learning-progress` |
| `server/routes/learningFeedback.js` | Routes mounted at `/api/learning-feedback` |

### User Model Extensions

Two fields were added to `server/models/User.js`:
- `points` (Number, default 0) — earned by answering quiz questions correctly
- `badges` (Array of String) — unlocked every 100 points (e.g. "Level 1 Badge")

---

## Data Flow

```
User ticks a topic
  → POST /api/learning-progress/topic  (optionalAuth)
  → Progress doc updated in MongoDB
  → Response includes updated completedTopics + userStats

User takes a quiz
  → GET /api/learning-modules/:id/topics/:topicId/quizzes
  → POST /api/learning-progress/quiz (protect)
  → Points and badge logic applied to User doc
  → Frontend updates coin count, triggers badge modal if new badge
```

---

## Points & Badge System

- Points are awarded **only for correct quiz answers**
- Points per correct answer: 1 pt (modules 1–10), 2 pt (11–20), 3 pt (21+)
- Every 100 points unlocks a badge level ("Level 1 Badge", "Level 2 Badge", …)
- Badge modal appears on new badge unlock with confetti animation
- Daily topic completion cap: 40 topics/day

---

## API Endpoints

### Modules (`/api/learning-modules`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | List all active modules (quizzes stripped, hasQuiz/quizCount included) |
| GET | `/:id` | None | Get single module |
| POST | `/` | Admin | Create module |
| PUT | `/reorder` | Admin | Batch update module order |
| PUT | `/:id` | Admin | Update module |
| DELETE | `/:id` | Admin | Delete module |
| POST | `/:id/topics` | Admin | Add topic to module |
| PUT | `/:id/topics/:topicId` | Admin | Update topic |
| DELETE | `/:id/topics/:topicId` | Admin | Delete topic |
| GET | `/:moduleId/topics/:topicId/quizzes` | None | Get quizzes for a topic |

### Progress (`/api/learning-progress`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Required | Get current user's progress + userStats |
| POST | `/topic` | Optional | Toggle topic completion (unauthenticated → local only) |
| POST | `/quiz` | Required | Submit quiz attempt, award points/badges |
| GET | `/stats` | Required | Summary stats (topic/module counts) |

### Feedback (`/api/learning-feedback`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Required | Submit feedback message |
| GET | `/` | Admin | List all feedback |
| DELETE | `/:id` | Admin | Delete feedback |

---

## Setup Notes

1. Mount the three new route files in `server/index.js`
2. Seed initial modules via the admin dashboard or direct MongoDB insert
3. No separate migration needed — Mongoose creates collections on first write
