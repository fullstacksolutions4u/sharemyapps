# Monetization Strategy — ShareMyApps

> **Last updated:** 2026-06-07  
> **Status:** Planning

ShareMyApps is a multi-sided marketplace connecting developers, clients, recruiters, and mentors. Monetization should be layered across all sides of the platform without blocking core value for free users.

---

## 1. Developer-Side Plans (Freemium)

### Free Tier (current default)
- 3 project showcases
- Basic public portfolio link
- Standard badge eligibility
- Limited AI-match visibility (appear in results but ranked lower)

### Pro Developer — ~$5–9/month
- Unlimited project showcases
- Portfolio analytics (who viewed, from where)
- Priority ranking in AI recruiter searches
- "Verified Developer" badge on profile
- Resume AI analysis & suggestions (unlimited)
- Custom portfolio domain / vanity URL slug

### Elite Developer — ~$15–20/month
- Everything in Pro
- "Featured" spotlight rotation on Explore page
- Direct message priority (shown first in recruiter inboxes)
- "For Sale" project listings with reduced commission
- Monthly 1:1 career consultation credit

---

## 2. Recruiter / Client Subscriptions (B2B)

This is the highest-value side — recruiters pay to find talent.

### Free Recruiter
- 3 AI JD searches per month
- View top 10 results per search
- No candidate contact details

### Recruiter Standard — ~$49/month
- 30 AI JD searches/month
- Full results (up to 40 candidates)
- View contact details (email, phone, LinkedIn)
- Excel export of results
- Save up to 10 search histories

### Recruiter Pro — ~$99/month
- Unlimited AI JD searches
- Bulk candidate shortlisting
- Team seats (up to 3 users)
- ATS-style candidate pipeline (shortlist → interview → offer)
- Priority support

### Enterprise — Custom pricing
- Unlimited seats
- Dedicated account manager
- Custom integrations / API access
- SLA guarantees

---

## 3. Job Vacancy Listings (Pay-per-Post)

Clients posting vacancies pay for visibility tiers.

| Tier | Price | Visibility |
|---|---|---|
| Basic | Free | Listed, no highlight |
| Standard | $19/post | Highlighted, 30-day active |
| Featured | $49/post | Pinned top of list, 30-day active, email blast to matched devs |
| Sponsored | $99/post | Homepage banner + email blast + priority in AI search matches |

- Admin can manually upgrade/downgrade listings.
- Discounts for bulk post bundles (5 posts, 10 posts).

---

## 4. Freelance Project Marketplace (Commission)

Currently: clients post freelance projects; developers express interest.

- Platform takes **10–15% commission** on verified project agreements.
- Optional **escrow service** (integrate Stripe, Razorpay) — adds trust and justifies the fee.
- Featured listing fee ($9–19) to boost a project above organic listings.
- Future: built-in contract & milestone management to capture the full workflow.

---

## 5. Mentorship Marketplace (Commission)

Currently: mentors post paid/free mentorship slots; developers express interest.

- Platform takes **15–20% commission** on all paid mentorship sessions.
- Stripe/Razorpay integration for payment collection and payout.
- "Verified Mentor" badge ($19 one-time review fee) — manual vetting by admin.
- Featured mentor placement ($9/month) for top-of-list visibility.
- Bundle packages: mentors sell 4-session or 8-session packages with platform facilitation.

---

## 6. AI Feature Credits

AI-powered JD matching is the platform's differentiator — gate advanced use behind credits.

- Free users: **5 AI searches/month**
- Credits pack: **$9 for 20 searches**, $19 for 60 searches
- Credits roll over (no expiry within 6 months)
- Bulk credit packs for teams
- Auto-refill subscription option

This works as a lightweight entry point for recruiters not ready for a full subscription.

---

## 7. Profile Verification & Trust Badges

Sell trust signals that increase candidate confidence for clients.

| Badge | Fee | What it covers |
|---|---|---|
| ID Verified | $5 one-time | Government ID check (manual or via Stripe Identity) |
| Skills Verified | $9 one-time | Admin-reviewed project + skills audit |
| GitHub Verified | Free (OAuth) | Auto-verified via GitHub OAuth |
| Top Contributor | Auto (gamification) | Community score threshold — free |
| Premium Portfolio | Part of Pro plan | Visual "Pro" badge |

---

## 8. Resume Services

The platform already stores and displays resumes. Monetize this layer:

- **AI Resume Review** — $9 per review: score against job description, highlight gaps.
- **Resume Writing Service** — $49–99: human expert rewrites (outsourced, admin-coordinated).
- **Resume Builder** — Pro plan feature: guided form generates a formatted PDF resume.
- **Resume Visibility** — Free users' resumes hidden from recruiter search; Pro users' resumes searchable.

---

## 9. For-Sale Project Listings (Marketplace)

Already partially implemented (`forSale`, `price` fields on Project model).

- Developers list projects for sale with a price.
- Platform takes **10% transaction fee** on each sale.
- Escrow holds payment until buyer confirms delivery.
- Featured "Projects for Sale" section on Explore page.
- Stripe integration for secure transactions.

---

## 10. Sponsored / Promoted Profiles

- Developers pay to appear in a "Sponsored Developers" carousel on the homepage or Explore page.
- Pricing: $19/week, $49/month.
- Admin controls which sponsored profiles are active and in what order.
- Capped slots (e.g., 5 sponsored at a time) creates scarcity.

---

## 11. Platform API Access

Expose a public API for third-party tools (ATS vendors, job boards, HR tools).

- **Free tier**: read-only public project data, 100 req/day.
- **Paid tier**: $99/month — full developer search API, 10,000 req/day.
- **Enterprise**: custom rate limits, webhooks, dedicated key.
- Use the existing Express backend — add API key middleware + rate limiter per key.

---

## 12. White-Label / Managed Portals

For companies that want a branded internal talent portal:

- Branded subdomain (`acme.sharemyapps.com`)
- Company-only developer pool (invite-only)
- Custom admin panel with company branding
- Pricing: $299–999/month depending on seat count

---

## 13. Announcements / Sponsored Ticker

The Explore page already has an announcements ticker.

- Sell ticker slots to companies for job/event promotions.
- $29–49 per announcement, active for 7–14 days.
- Admin creates and activates; simple but high-visibility real estate.

---

## 14. Community & Events (Future)

- **Hackathons / Challenges** — Platform-hosted events sponsored by companies.
  - Company pays $500–2,000 to sponsor; prize pool funded by sponsor.
  - Winning projects get auto-featured on platform.
- **Webinars / Workshops** — Paid tickets ($9–29) to live sessions by mentors.
- **Newsletter / Job Digest** — Sponsored email digest sent to developer base.

---

## Implementation Priority

| Priority | Feature | Effort | Revenue Potential |
|---|---|---|---|
| 1 | Recruiter subscription tiers | Medium | High |
| 2 | AI credit packs | Low | Medium |
| 3 | Job vacancy listing tiers | Low | Medium |
| 4 | Pro Developer plan | Medium | Medium |
| 5 | Mentorship commission + Stripe | High | High |
| 6 | Freelance commission + escrow | High | High |
| 7 | For-sale project marketplace | Medium | Medium |
| 8 | Resume AI review (paid) | Low | Low–Medium |
| 9 | Sponsored profiles / ticker | Low | Low |
| 10 | API access tiers | Medium | Medium (long-term) |
| 11 | White-label portals | High | High (long-term) |

---

## Notes

- Start with **Recruiter subscriptions** and **AI credits** — lowest friction, highest willingness to pay.
- Gate features progressively; don't put everything behind a paywall on day one.
- Use **Stripe** for subscriptions, one-time payments, and escrow.
- Track `aiUsageCount` and `aiUsageDate` (already in the User model) to enforce AI credit limits.
- The `forSale` and `price` fields on Project are already in the model — the marketplace layer just needs a transaction flow.
