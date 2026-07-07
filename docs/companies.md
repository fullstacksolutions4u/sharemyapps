# Companies

Admin-panel section listing every company the platform's developers have worked at, derived on the fly from the resume summary JSON stored in `User.resumeData` (pasted via Admin → Users → edit → "Resume Summary Data"). Read-only — there is no Company collection.

## Endpoint

`GET /api/admin/companies` (admin only — behind `protect` + `requireAdmin`)

Handler: `getCompanies` in `server/controllers/adminController.js`.

Scans all non-deleted developers with `resumeData` set and extracts work entries from all shapes that exist in stored documents:

1. `resumeData.workExperience[]` — canonical shape: `{ company, role, startDate, endDate, current }`
2. `resumeData.experience[]` — legacy shape: `{ company, role, duration }` (`current` inferred from "Present"/"current" in the duration string)
3. `resumeData.currentCompany` / `resumeData.current_company` scalar — added only if the arrays didn't already mention that company

Company names are deduped case- and whitespace-insensitively (first-seen casing wins for display). Each developer appears once per company with all stints grouped.

Response:

```json
{
  "companies": [
    {
      "name": "Acme Corp",
      "developerCount": 3,
      "currentCount": 1,
      "developers": [
        {
          "userId": "...", "name": "...", "email": "...",
          "avatar": "...", "regNumber": "...", "designations": ["MEAN Stack"], "current": true,
          "stints": [{ "role": "Full Stack Developer", "period": "2023-12 – Present", "current": true }]
        }
      ]
    }
  ],
  "totalCompanies": 42,
  "usersScanned": 120
}
```

Sorted by `developerCount` desc, then name asc.

## UI

`client/src/pages/admin/AdminCompaniesSection.jsx`, wired as the `companies` section in `AdminPanel.jsx` (sidebar item "Companies", Building2 icon, under Users). No page header — the section starts with the toolbar (sort toggle + search).

- **Table**: Company | Developers (count) | Designations. The Designations column tallies the platform designations of each company's developers (teal pills like "MERN Stack Developer 13", top 3 shown, "+N more" beyond that; "—" if none).
- **Expanded row** (click a company): developers grouped **column-wise by designation** — one column card per designation, ordered by developer count desc (ties alphabetical), "No Designation" always last. Responsive grid: 3 columns on large screens, 2 on tablets, 1 on mobile. Each card lists avatar, name, reg number, "Current" badge, email, and stints (role · period). A developer with multiple designations appears in each of their columns.
- **Toolbar**: sort toggle pills (Most Developers / A–Z) and client-side search by company or developer name/email. Changing either resets to page 1.
- **Pagination**: 10 companies per page, grouped page numbers (10 at a time) with ‹ › for single steps and « » (ChevronsLeft/ChevronsRight) to jump to the previous/next batch of 10 pages — tooltips show the target page range.

## Progress log

- **2026-07-07** — Initial feature: `GET /api/admin/companies` endpoint (handles all three resumeData shapes, case/whitespace-insensitive dedupe), `AdminCompaniesSection` with search + expandable rows, sidebar wiring. Verified with fixture-driven controller test (9 assertions) plus client lint/build.
- **2026-07-07** — Pagination fixed for large datasets (738 companies): grouped page numbers instead of one button per page.
- **2026-07-07** — Removed the "Companies / N companies from M resumes" header.
- **2026-07-07** — Added sort toggle: Most Developers (default) / A–Z.
- **2026-07-07** — Replaced "Currently There" column with Designations counts; server now returns each developer's `designations`.
- **2026-07-07** — Expanded view redesigned: developers grouped into designation columns, largest group first.
- **2026-07-07** — Pagination batch-jump "…" buttons replaced with « » double-chevron icons with page-range tooltips.

## Known limitation

Only exact case/whitespace-insensitive names merge — e.g. "Asubrix International" and "Asubrix International Pvt Ltd" appear as two separate companies.
