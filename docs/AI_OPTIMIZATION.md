# AI Optimization Tracker

Tracks performance improvements, ideas, and decisions for the AI-powered Find Developers feature.

---

## Current Architecture

| Layer | What it does |
|-------|-------------|
| `POST /api/users/find-developers` | Fetches up to 40 developers from MongoDB, scores each with a simple keyword overlap algorithm |
| `POST /api/jd/analyze` | Sends the raw JD to Claude (claude-haiku) to extract structured fields (skills, experience, role, etc.) |
| `server/middleware/aiLimit.js` | Per-user daily cap (currently 50 for testing, revert to 20) |
| `client/src/pages/FindDevelopers.jsx` | 4-step loading animation, shows top 20, "More" reveals remaining 20 |

---

## Known Bottlenecks

- [ ] **Scoring is keyword-only** — no semantic understanding; "React" and "ReactJS" treated as different skills
- [ ] **Full developer pool fetched every time** — no caching; cold DB scan on every request
- [ ] **No ranking persistence** — results re-ranked on every call even for identical JDs
- [ ] **JD extraction re-runs on every search** — no dedup check for recently seen JDs
- [ ] **Claude prompt is not cached** — system prompt sent fresh on every request (wastes tokens)

---

## Optimization Ideas

### 1. Prompt Caching (Quick win)
- Use Anthropic's `cache_control` feature on the static system prompt portion
- Saves ~60–80% of input tokens on repeated calls
- **Effort:** Low | **Impact:** Cost reduction

### 2. Skill Normalization (Medium)
- Build a skill alias map (`ReactJS → React`, `Node → Node.js`, `Postgres → PostgreSQL`)
- Apply normalization before scoring
- Store normalized skills on the User document at profile-save time
- **Effort:** Medium | **Impact:** Better match quality

### 3. JD Deduplication / Result Caching (Medium)
- Hash the JD text (SHA-256) and cache `{ extractedFields, rankedDeveloperIds }` in Redis or MongoDB with a 1-hour TTL
- On cache hit: skip Claude call entirely, re-fetch developers by stored IDs
- **Effort:** Medium | **Impact:** Latency + cost reduction for repeated JDs

### 4. Pre-computed Skill Vectors (Long-term)
- Generate a skill embedding vector per developer on profile update
- On search: embed the JD once, compute cosine similarity against all vectors
- Eliminates keyword matching entirely
- **Effort:** High | **Impact:** Significantly better semantic matching

### 5. Incremental Scoring (Medium)
- Return first 10 results immediately while the remaining 30 are scored in the background
- Stream results to client via SSE or WebSocket
- **Effort:** High | **Impact:** Perceived latency improvement

### 6. Rate Limit Tuning
- Current limit: 50/day (test mode)
- Production target: 20/day per recruiter
- Consider tiered limits: free = 10/day, premium = unlimited
- **File:** `server/middleware/aiLimit.js` → `DAILY_LIMIT`

---

## Completed Optimizations

| Date | Change | Impact |
|------|--------|--------|
| 2026-06-05 | Fetch 40 developers, show 20 with "More" button | Reduces perceived latency; client-side pagination |
| 2026-06-05 | Increased body limit to 5mb | Fixed PayloadTooLargeError when saving 40 dev snapshots |
| 2026-06-05 | 4-step segmented progress animation | Better UX during AI processing |

---

## Pending

- [ ] Revert `DAILY_LIMIT` from 50 → 20 after testing (`server/middleware/aiLimit.js`)
- [ ] Implement skill normalization alias map
- [ ] Evaluate prompt caching with Anthropic SDK `cache_control`
