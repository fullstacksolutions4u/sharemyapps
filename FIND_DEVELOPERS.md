# Find Developers — AI-Powered JD Matching

## Overview
A recruiter-only page where users paste a Job Description (JD) and get AI-ranked developer matches. Built to be cost-effective: one small AI call per search, all matching done free in MongoDB.

---

## How It Works

```
Recruiter pastes JD → Submit
        ↓
[1] Claude Haiku extracts structured data (~$0.0003/search)
        ↓
{ skills: ["React", "Node.js"], roles: ["Full Stack Dev"], level: "senior" }
        ↓
[2] MongoDB aggregation scores every developer (free)
        ↓
Returns top 20 developers sorted by match score
```

**No embeddings. No vector DB. No per-developer AI calls.**

---

## Match Scoring

| Developer Signal | Source Field | Weight |
|---|---|---|
| Project tech tags | `projects[].techTags` | ×3 |
| Mentorship tech | `mentorshipTech` | ×2 |
| Job titles / designations | `designations` | ×2 |
| Language preference | `languagePreference` | ×1 |

`matchScore = (techTagMatches×3) + (mentorMatches×2) + (roleMatches×2) + (langMatches×1)`

Only developers with at least 1 approved project are included. Only developers with `matchScore > 0` are returned.

---

## Files to Create / Modify

### New Files
| File | Purpose |
|---|---|
| `server/utils/aiExtract.js` | Claude Haiku call — extracts skills/roles from JD |
| `client/src/pages/FindDevelopers.jsx` | Recruiter-facing UI page |

### Modified Files
| File | Change |
|---|---|
| `server/routes/users.js` | Add `POST /api/users/find-developers` endpoint |
| `client/src/App.jsx` | Add `/find-developers` route (ProtectedRoute) |
| `server/.env` | Add `ANTHROPIC_API_KEY` |

### Dependency
```bash
# Run inside server/
npm install @anthropic-ai/sdk
```

---

## Backend

### `server/utils/aiExtract.js`
```js
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

exports.extractJDRequirements = async (jdText) => {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Extract hiring requirements from this job description. Return ONLY valid JSON with keys:
- skills: string array of tech skills/frameworks
- roles: string array of job titles
- level: one of junior | mid | senior | any
- availability: one of freelance | fulltime | any

JD:
${jdText}`
    }]
  });
  return JSON.parse(msg.content[0].text);
};
```

### `POST /api/users/find-developers` (in `server/routes/users.js`)
- Protected (JWT required)
- Body: `{ jd: string }`
- Response: `{ developers: [...], extracted: { skills, roles, level } }`

**Pipeline steps:**
1. Match all non-deleted, non-hidden developers
2. Lookup their approved projects (get `techTags`)
3. Filter to only those with ≥1 approved project
4. Flatten all techTags into `allTechTags` array
5. For each of the 4 signal fields, count how many extracted terms match (case-insensitive regex)
6. Compute `matchScore`
7. Filter `matchScore > 0`
8. Sort by `matchScore DESC`, `createdAt DESC`
9. Limit 20
10. Strip internal fields from projection

---

## Frontend — `client/src/pages/FindDevelopers.jsx`

### UI Layout
```
┌─────────────────────────────────────────────┐
│  Find the Right Developer                   │
│  Paste your JD and let AI match you         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Paste job description here...      │   │
│  │                                     │   │
│  │  (textarea, 6 rows min)             │   │
│  └─────────────────────────────────────┘   │
│  [ Find Matching Developers → ]             │
│                                             │
│  AI detected: [React] [Node.js] [MongoDB]  │  ← skill chips after search
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Dev Card │ │ Dev Card │ │ Dev Card │   │  ← same card style as /developers
│  │ 5 skills │ │ 3 skills │ │ 2 skills │   │  ← match count badge
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
```

### Guards
- If `!user` → redirect `/login`
- If `user.userType !== 'recruiter' && user.userType !== 'client'` → redirect `/developers`

### States
- **Idle**: JD textarea + submit button
- **Loading**: Spinner + "Analysing JD…"
- **Results**: Extracted skill chips + developer grid
- **Empty**: "No developers matched. Try broadening your JD."
- **Error**: Toast on API failure

---

## App.jsx Route
```jsx
import FindDevelopers from './pages/FindDevelopers';

// Inside routes (ProtectedRoute):
<Route path="/find-developers" element={<ProtectedRoute><FindDevelopers /></ProtectedRoute>} />
```

---

## Environment
```
# server/.env
ANTHROPIC_API_KEY=sk-ant-...
```
Get key: https://console.anthropic.com/

---

## Implementation Order
1. `npm install @anthropic-ai/sdk` in `server/`
2. Add `ANTHROPIC_API_KEY` to `server/.env`
3. Create `server/utils/aiExtract.js`
4. Add endpoint to `server/routes/users.js`
5. Create `client/src/pages/FindDevelopers.jsx`
6. Register route in `client/src/App.jsx`

---

## Testing Checklist
- [ ] Login as recruiter → navbar shows "Find Developers"
- [ ] Navigate to `/find-developers` → page loads
- [ ] Paste JD → submit → loading state shown
- [ ] Results appear with skill chips (AI extracted)
- [ ] Developer cards show match count badge
- [ ] Login as developer → `/find-developers` redirects to `/developers`
- [ ] Empty JD → validation error, no AI call made
- [ ] Server logs show exactly 1 AI call per submission
