# Premium Services — Implementation Plan & Progress Tracker

## Overview

Premium services are individual offerings unlocked per-user by the admin. All services are **locked by default**. Users see locked services at the bottom of their dashboard sidebar, and can view details — but cannot access them until an admin explicitly unlocks that service for their account.

The first service to ship is **1:1 Session with Placement Specialist for Job Hunting Guidance**.

---

## Service Catalogue

| Key | Label | Status |
|-----|-------|--------|
| `placement_session` | 1:1 Session with Placement Specialist for Job Hunting Guidance | 🔴 Not started |

> Add future services here as rows. Each service needs a unique `key` (snake_case) agreed on before implementation.

---

## Architecture

### Data model — `User`
Add a `premiumServices` field to `server/models/User.js`:

```js
premiumServices: [{
  key:         { type: String, required: true },   // e.g. 'placement_session'
  unlockedAt:  { type: Date, default: Date.now },
  unlockedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who granted
  notes:       { type: String, default: '' },       // optional admin note
}],
```

Default is an empty array — all services locked.

### Service registry (`client` + `server`)
Define the canonical list of services in one shared-friendly place. On the server, define it in `server/config/premiumServices.js`; import it from API routes. On the client, mirror it in `client/src/config/premiumServices.js`.

```js
// server/config/premiumServices.js (and client mirror)
module.exports = [
  {
    key: 'placement_session',
    label: '1:1 Session with Placement Specialist for Job Hunting Guidance',
    description: 'A private, scheduled call with a dedicated placement officer to map your job search strategy, review your resume, and build a step-by-step action plan.',
    icon: 'UserCheck',         // lucide icon name for client
  },
  // future services added here
];
```

---

## API Endpoints

All new routes go in a new file `server/routes/premiumServices.js` and mount at `/api/premium-services`.

### User-facing

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/premium-services/my-services` | Returns array of the user's unlocked service keys + metadata |

### Admin-facing (require `requireAdmin` middleware)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/premium-services/users` | List all users with their unlocked services |
| `POST` | `/api/admin/premium-services/:userId/unlock` | Unlock a service for a user (`{ key, notes }` in body) |
| `DELETE` | `/api/admin/premium-services/:userId/revoke/:key` | Revoke a previously unlocked service |

---

## UI — User Side (Dashboard)

**File:** `client/src/pages/Dashboard.jsx`

The `NAV` array already ends with `{ key: 'premium', label: 'Premium Services', icon: Crown }`. This entry is the gateway.

**`PaidServices.jsx` → rename/refactor to `PremiumServices.jsx`**

Replace the current free-vs-premium pricing card layout with a service-cards layout:

```
┌──────────────────────────────────────────────┐
│  Premium Services                            │
│  Services unlocked for you by our team       │
├──────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐ │
│  │  🔒  1:1 Session with Placement         │ │
│  │       Specialist…                       │ │
│  │  [Locked — contact us to unlock]        │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  (more services added as rows below)         │
└──────────────────────────────────────────────┘
```

When a service is **unlocked**, the card shows:
- No lock icon
- Green "Unlocked" badge
- Action button (e.g. "Schedule Session") or descriptive content specific to that service

Data fetch: `GET /api/premium-services/my-services` on mount → store in state → derive `isUnlocked(key)` helper.

---

## UI — Admin Side (Admin Panel)

**File:** `client/src/pages/admin/AdminPremiumServicesSection.jsx` (new file)

Mount it in `AdminPanel.jsx` under the existing `offers` tab (or add a new `premium_services` tab alongside it).

Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Premium Services Management                            │
│  Search user…                          [Refresh]        │
├─────────────────────────────────────────────────────────┤
│  User row  →  [service chips]  →  [+ Unlock]  [Revoke] │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

**Unlock modal** opens when admin clicks `+ Unlock` on a user row:
- Dropdown of available services (from service registry, excluding already-unlocked ones)
- Optional notes field
- Confirm button → calls `POST /api/admin/premium-services/:userId/unlock`

**Revoke** button (per unlocked chip) → confirm dialog → `DELETE` call.

---

## Progress Checklist

### Backend

- [x] Add `premiumServices` array field to `server/models/User.js`
- [x] Create `server/routes/premiumServices.js` with user route `GET /my-services`
- [x] Add admin routes to `server/routes/admin.js`:
  - [x] `GET  /admin/premium-services/users`
  - [x] `POST /admin/premium-services/:userId/unlock`
  - [x] `DELETE /admin/premium-services/:userId/revoke/:key`
- [x] Mount new router in `server/index.js`

### Frontend — Client (user side)

- [x] Create `client/src/config/premiumServices.js` (service registry, ES module)
- [x] Rewrote `client/src/pages/PaidServices.jsx` to locked-service card layout
  - [x] Fetch `GET /api/premium-services/my-services` on mount
  - [x] Render all services from registry as cards (locked by default)
  - [x] Unlocked state: green badge + success message
  - [x] "1:1 Session with Placement Specialist" as first card
- [x] Dashboard import unchanged — `PaidServices` is still rendered at `section === 'premium'`

### Frontend — Admin side

- [x] Created `client/src/pages/admin/AdminPremiumServicesSection.jsx`
  - [x] Full user list with per-user unlocked service chips
  - [x] Unlock modal: service dropdown (filtered to not-yet-unlocked) + admin notes field
  - [x] Revoke button per service chip with confirm dialog
- [x] Imported and wired in `client/src/pages/AdminPanel.jsx`
  - [x] New `Service Access` nav tab (`key: 'service_access'`, icon: Unlock)

---

## Notes & Decisions

- **Lock granularity:** Per-user, per-service. Admin unlocks service X for user Y independently of any subscription or payment.
- **No payment gate yet:** The unlock is purely manual by admin for now. Payment integration is a future concern.
- **Service content per key:** Each service may render different UI when unlocked. Start with a simple "you're unlocked — we'll contact you" message for `placement_session`. The card can evolve into a scheduler widget later.
- **Sidebar position:** "Premium Services" is already last in the `NAV` array in `Dashboard.jsx`. Keep it there.
- **Route key stays `premium`:** No rename needed in the dashboard URL param.
