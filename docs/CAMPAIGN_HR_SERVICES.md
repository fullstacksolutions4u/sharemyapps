# HR Services Marketing Campaign

## Overview

Email campaign targeting 100 registered developers on ShareMyApps to promote the paid HR placement services — specifically the ₹999 Standard plan with its money-back guarantee.

---

## Target Audience

- **Who:** All registered developers (userType: `developer`, isDeleted: `false`)
- **Count:** ~100 users
- **Pain point:** Sending dozens of job applications with no replies or interview calls

---

## Campaign Goals

1. Drive sign-ups for the ₹999 Standard plan (primary)
2. Introduce the ₹499 Basic plan as a low-barrier entry (secondary)
3. Establish trust via the zero-risk refund guarantee

---

## Plans Being Promoted

| Plan     | Price | Key Benefit                              |
|----------|-------|------------------------------------------|
| Basic    | ₹499  | Resume review + LinkedIn/GitHub feedback |
| Standard | ₹999  | 10 targeted job applications by HR team  |

### Standard Plan — Refund Guarantee
If the developer does not receive **a single interview callback** from the 10 applications within **30 days**, the full ₹999 is refunded. No questions asked.

Refund eligibility conditions:
- Valid, up-to-date resume submitted
- Job preference form completed
- Developer has not rejected any of the applications placed on their behalf
- Refund processed within 7 business days of claim

---

## Email Details

| Field   | Value |
|---------|-------|
| Subject | `You've sent 50+ apps. We'll send 10 that actually land interviews — or your ₹999 back.` |
| Sender  | ShareMyApps `hello@sharemyapps.in` |
| CTA     | "Claim My ₹999 Plan →" → `/hr-services` |

### Email Structure
1. **Hook** — Acknowledge the frustration (ghost replies, no interviews)
2. **Pain stat** — "Average developer sends 80+ applications before an interview"
3. **Solution** — Dedicated HR team applies on their behalf
4. **Plan comparison** — ₹499 Basic vs ₹999 Standard (Standard highlighted)
5. **Zero-Risk Guarantee block** — Refund if zero callbacks in 30 days
6. **Trust signals** — 48h activation, 10 applications, 100% money-back
7. **CTA button** + P.S. line
8. **Fine print** — Refund terms

---

## Sending Method

**Platform:** Brevo Campaigns (EmailCampaignsApi)

The campaign is created programmatically via the Brevo API and appears in the Brevo dashboard under **Marketing → Campaigns → Email** with full analytics (opens, clicks, unsubscribes).

### Script

```bash
# Dry run — preview without sending
node server/scripts/sendMarketingCampaign.js --dry-run --list=<LIST_ID>

# Send to all users on the list
node server/scripts/sendMarketingCampaign.js --list=<LIST_ID>
```

**LIST_ID** — find it in Brevo: Contacts → Lists → click your developer list → check the URL `?id=XX`

### Required env vars (server/.env)
```
BREVO_API_KEY=
EMAIL_FROM=hello@sharemyapps.in
CLIENT_URL=https://sharemyapps.in
```

---

## Tracking & Results

After sending, check the Brevo campaign report for:
- **Open rate** — benchmark: >30%
- **Click rate** — benchmark: >10%
- **Unsubscribes** — keep below 0.5%
- **Conversions** — track `/hr-services` purchases in the admin panel

Previous campaign ("Recruiter Outreach") benchmarks for reference:
- 100 recipients · 35.96% open rate · 14.61% click rate · 2.25% unsubscribed

---

## Follow-up Plan

| Timing     | Action |
|------------|--------|
| Day 3      | Check open rate — resend to non-openers with a different subject line |
| Day 7      | Send reminder to clickers who didn't purchase |
| Day 14     | Final nudge — "Offer closes soon" urgency email |
| Day 30     | Analyse conversions, collect testimonials from buyers |
