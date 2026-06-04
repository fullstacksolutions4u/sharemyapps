# ShareMyApps — Roadmap & Change Tracker

> Track all planned, in-progress, and completed performance improvements and new features.

---

## Legend

| Status | Meaning |
|--------|---------|
| `[ ]` | Planned |
| `[~]` | In Progress |
| `[x]` | Done |

---

## Performance Improvements

### Frontend
- [ ] Code-split route bundles (React.lazy + Suspense)
- [ ] Debounce search/filter inputs
- [ ] Virtualize long project lists (TanStack Virtual)
- [ ] Compress and lazy-load images (loading="lazy", srcset)
- [ ] Cache API responses with TanStack Query staleTime tuning
- [ ] Reduce bundle size — audit with `vite-bundle-visualizer`

### Backend
- [ ] Add compound indexes for common query patterns (e.g. `status + createdAt`)
- [ ] Paginate all list endpoints (projects, messages, comments)
- [ ] Add `select()` projection to queries to avoid over-fetching fields
- [ ] Cache frequently read data (approved projects feed) with in-memory TTL or Redis
- [ ] Enable HTTP compression (`compression` middleware)
- [ ] Rate-limit public endpoints (express-rate-limit)

---

## New Features

### Developer Experience
- [ ] 
- [ ] 

### Client / Recruiter Experience
- [ ] 

### Admin Panel
- [ ] 

### General / Auth
- [ ] 

---

## Completed

<!-- Move items here once merged/deployed -->

---

## Notes

- CI runs lint + build only — no automated tests yet.
- Deployment: client → Firebase Hosting, server → Cloud Run (GCP).
- Update this file in the same PR as the change it tracks.
