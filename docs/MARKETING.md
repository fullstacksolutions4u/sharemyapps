# ShareMyApps — Cold Email Outreach Guide

## Goal
Reach hiring managers, startup founders, and SMBs who need developers — drive them to browse ShareMyApps developer portfolios and hire through the platform.

---

## 1. Domain Email Setup (GoDaddy / Titan)

**Buy:** Pro Light plan (₹39/mo) — enough for outreach.

**Create these inboxes:**
- `hello@sharemyapps.in` — primary outreach
- `team@sharemyapps.in` — secondary
- `support@sharemyapps.in` — tertiary

Send max 20–30 emails/day per inbox. Never blast from one address.

---

## 2. DNS Records to Configure (Don't Skip)

After purchase, set these in your domain DNS:

**SPF**
```
v=spf1 include:_spf.titan.email ~all
```
*(GoDaddy/Titan will give you the exact value — use theirs)*

**DKIM**
Enable in the Titan/GoDaddy email dashboard. This cryptographically signs your emails as genuine.

**DMARC**
Start with:
```
v=DMARC1; p=none;
```
After 4 weeks of clean sending, upgrade to:
```
v=DMARC1; p=quarantine;
```

---

## 3. Domain Warm-Up Schedule

New domain = zero trust. Build it slowly.

| Period | Emails/day |
|--------|-----------|
| Week 1 | 5–10 |
| Week 2 | 20–30 |
| Week 3 | 40–50 |
| Week 4+ | 80–100 |

Sending 200+ emails from day one will blacklist your domain.

---

## 4. Email Copy Rules

**Subject line — rotate per batch (never repeat the same one):**
- `A few website improvements we noticed`
- `Some observations about your website`
- `Quick feedback on your website`
- `Website issues we came across while reviewing`
- `Developers available for your next project`

**Body rules:**
- Plain text only — no HTML templates, no fancy formatting
- One link maximum
- Don't say `https://sharemyapps.in/explore` — say *"You can review developer portfolios on the ShareMyApps platform"* and link just the homepage
- No attachments
- Personalize the company name in each email

**Signature — use a real name:**
```
Tony
Founder, ShareMyApps
+91 8848118585
sharemyapps.in
```
Not: *"Team ShareMyApps"*

---

## 5. What NOT to Do

- No Mailchimp / mass mailing tools for cold outreach
- No open/click tracking pixels initially (spam filters detect these)
- No sending the same subject to 100 people
- No more than 2 links in one email
- No bulk sending from Gmail (`@gmail.com` = zero credibility for B2B)

---

## 6. Sending Stack (Recommended)

**Phase 1 — Manual (Weeks 1–3)**
- GoDaddy Titan email via webmail or Gmail SMTP
- 30 emails/day across 2 inboxes
- Personalized, one by one

**Phase 2 — Semi-automated (Week 4+)**
- Tool: [Instantly.ai](https://instantly.ai) or [Lemlist](https://lemlist.com)
- Connect multiple inboxes
- Rotate subjects and sending schedules
- Still keep per-inbox volume under 50/day

---

## 7. Target Audience for Outreach

| Segment | What to offer |
|---------|--------------|
| Startups / SMBs | Hire vetted developers via portfolios |
| IT recruiters | Source candidates with live project proof |
| Digital agencies | Find freelance developers for project work |
| Non-tech founders | Get a tech co-founder or contract developer |

---

## 8. Sample Cold Email

**Subject:** `A few observations about your website`

```
Hi [First Name],

I came across [Company Name] while looking at businesses in [industry/city].

I run ShareMyApps — a platform where developers showcase live projects and 
side products. We currently have 300+ verified developers across web, mobile, 
and full-stack roles, all with working demos you can actually try.

If you ever need to hire a developer or get a project built quickly, it might 
be worth a look: sharemyapps.in

Happy to connect if useful.

Tony
Founder, ShareMyApps
+91 8848118585
```

---

## 9. Tracking What Works

Keep a simple spreadsheet:
- Date sent
- Inbox used
- Subject line used
- Replies received
- Conversions (visits / signups)

Iterate subject lines weekly based on reply rate.

---

## 10. Summary Checklist

- [ ] Buy GoDaddy Pro Light (₹39/mo)
- [ ] Create `hello@`, `team@`, `support@` inboxes
- [ ] Set SPF + DKIM + DMARC records
- [ ] Warm up — max 10 emails day 1
- [ ] Plain text only, one link, real name signature
- [ ] Rotate subject lines per batch
- [ ] No tracking pixels for first month
- [ ] Move to Instantly/Lemlist after week 4
