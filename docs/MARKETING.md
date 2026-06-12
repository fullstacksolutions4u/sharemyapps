# ShareMyApps — Cold Email Outreach Guide

## Goal
Reach hiring managers, startup founders, and SMBs who need developers — drive them to browse ShareMyApps developer portfolios and hire through the platform.

---

## 1. Domain Email Setup (GoDaddy / Outlook)

**Active inbox:** `hello@sharemyapps.in` — set up via GoDaddy Workspace (Outlook/secureserver.net)

Send max 20–30 emails/day per inbox. Never blast from one address.

---

## 2. DNS Records — Current Live Configuration

All records are configured on GoDaddy DNS for `sharemyapps.in`.

### SPF (TXT @ record)
```
v=spf1 include:secureserver.net include:spf.brevo.com ~all
```
Covers both GoDaddy/Outlook and Brevo sending.

### DKIM
| Selector | Type | Status |
|----------|------|--------|
| `secureserver1._domainkey` | CNAME → s1.dkim.sharemyapps_in.73e.onsecureserver.net | ✓ Active (Outlook) |
| `secureserver2._domainkey` | CNAME → s2.dkim.sharemyapps_in.73e.onsecureserver.net | ✓ Active (Outlook) |
| `brevo1._domainkey` | CNAME → b1.sharemyapps-in.dkim.brevo.com | ✓ Active (Brevo) |
| `brevo2._domainkey` | CNAME → b2.sharemyapps-in.dkim.brevo.com | ✓ Active (Brevo) |

### DMARC (TXT _dmarc record)
```
v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:hello@sharemyapps.in;
```
DMARC reports are sent to `hello@sharemyapps.in`. Upgrade to `p=reject` after 2–3 months of clean sending.

### MX Records
| Priority | Server |
|----------|--------|
| 0 | smtp.secureserver.net |
| 10 | mailstore1.secureserver.net |

---

## 3. Email Health Check Results (Jun 12, 2026)

### Mail-Tester Score: 8.7/10
| Issue | Points Lost | Status |
|-------|-------------|--------|
| New domain age penalty (`FROM_FMBLA_NEWDOM14`) | -0.999 | Auto-resolves after 14 days — nothing to fix |
| LinkedIn link blocked by bot detection | -0.5 | LinkedIn returns 999 to crawlers — not actually broken; remove from email body |
| DKIM signed + valid | ✓ | — |
| IP clean — not listed on any of 23 blocklists | ✓ | — |

### EasyDMARC Score: 5/10 (misleading for new domains)
- **SPF:** Valid ✓
- **DKIM:** "Undetected" — EasyDMARC needs DMARC aggregate reports to discover selectors; will resolve with email traffic
- **DMARC:** Warning — they want their own email in `rua` (sales pitch); our config is correct

**Target: Re-test on mail-tester.com after 2 weeks — expected score 9.5+/10.**

### How to Check Email Health
1. **mail-tester.com** — send a real email to their temp address, get score + full breakdown (best all-in-one check)
2. **mxtoolbox.com** — check individual SPF / DKIM / DMARC / blacklist records
3. **postmaster.google.com** — add domain for ongoing Gmail delivery monitoring
4. **Brevo dashboard** → Settings → Senders & IP → Domains — green checkmarks for SPF/DKIM
5. **Gmail "Show original"** — send to Gmail, open email → ⋮ → Show original → verify `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`

---

## 4. Domain Warm-Up Schedule

New domain = zero trust. Build it slowly.

| Period | Emails/day |
|--------|-----------|
| Week 1 | 5–10 |
| Week 2 | 20–30 |
| Week 3 | 40–50 |
| Week 4+ | 80–100 |

Sending 200+ emails from day one will blacklist your domain.

---

## 5. Email Copy Rules

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

## 6. What NOT to Do

- No Mailchimp / mass mailing tools for cold outreach
- No open/click tracking pixels initially (spam filters detect these)
- No sending the same subject to 100 people
- No more than 2 links in one email
- No bulk sending from Gmail (`@gmail.com` = zero credibility for B2B)

---

## 7. Sending Stack (Recommended)

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

## 8. Target Audience for Outreach

| Segment | What to offer |
|---------|--------------|
| Startups / SMBs | Hire vetted developers via portfolios |
| IT recruiters | Source candidates with live project proof |
| Digital agencies | Find freelance developers for project work |
| Non-tech founders | Get a tech co-founder or contract developer |

---

## 9. Sample Cold Email

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

## 10. Tracking What Works

Keep a simple spreadsheet:
- Date sent
- Inbox used
- Subject line used
- Replies received
- Conversions (visits / signups)

Iterate subject lines weekly based on reply rate.

---

## 11. Summary Checklist

- [x] Create `hello@sharemyapps.in` inbox (GoDaddy/Outlook)
- [x] Set SPF record (covers Outlook + Brevo)
- [x] Set DKIM records (Outlook + Brevo selectors)
- [x] Set DMARC record (`p=quarantine`, reports → hello@sharemyapps.in)
- [x] Email health check — mail-tester.com score: 8.7/10
- [x] IP clean — not listed on any of 23 blocklists
- [ ] Re-test on mail-tester.com after 2 weeks (expect 9.5+/10)
- [ ] Warm up — max 15–20 emails/day for first 2 weeks
- [ ] Plain text only, one link, real name signature
- [ ] Remove LinkedIn link from email body (causes -0.5 on mail-tester)
- [ ] Rotate subject lines per batch
- [ ] No tracking pixels for first month
- [ ] Upgrade DMARC to `p=reject` after 2–3 months of clean sending
- [ ] Move to Instantly/Lemlist after week 4
