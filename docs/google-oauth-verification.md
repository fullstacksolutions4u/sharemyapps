# Google OAuth Brand Verification — Complete Guide

> **Who this is for:** Developers building web apps with Google Sign-In who need to remove the "unverified app" warning from their OAuth consent screen.

---

## Table of Contents

1. [Why Verification Exists](#1-why-verification-exists)
2. [Understanding the OAuth Consent Screen](#2-understanding-the-oauth-consent-screen)
3. [Scopes — Sensitive vs Non-Sensitive](#3-scopes--sensitive-vs-non-sensitive)
4. [The Four Verification Requirements](#4-the-four-verification-requirements)
5. [Step-by-Step: Homepage Requirements](#5-step-by-step-homepage-requirements)
6. [Step-by-Step: Writing a Compliant Privacy Policy](#6-step-by-step-writing-a-compliant-privacy-policy)
7. [Step-by-Step: Logo Requirements](#7-step-by-step-logo-requirements)
8. [Step-by-Step: Domain Verification](#8-step-by-step-domain-verification)
9. [Step-by-Step: Recording the Demo Video](#9-step-by-step-recording-the-demo-video)
10. [Step-by-Step: Submitting for Verification](#10-step-by-step-submitting-for-verification)
11. [After Verification — Publishing Your Branding](#11-after-verification--publishing-your-branding)
12. [What Users See Before vs After Verification](#12-what-users-see-before-vs-after-verification)
13. [Common Rejection Reasons and Fixes](#13-common-rejection-reasons-and-fixes)
14. [How ShareMyApps Implements This](#14-how-sharemyapps-implements-this)

---

## 1. Why Verification Exists

When you build an app that uses **Google Sign-In (OAuth 2.0)**, Google needs to know:

- You are the real owner of the app and domain
- Your app clearly explains to users what Google data it accesses
- Users have a public Privacy Policy they can read before signing in

Without verification, every user who tries to sign in with Google sees a scary red warning screen:

```
⚠️  Google hasn't verified this app
The app is requesting access to sensitive information in your 
Google Account. Until the developer (you@email.com) verifies 
this app with Google, you shouldn't use it.
```

This destroys user trust and kills sign-up rates. **Verification removes this warning entirely.**

---

## 2. Understanding the OAuth Consent Screen

The OAuth consent screen is the popup that appears when a user clicks "Sign in with Google". It shows:

| Element | Description |
|---|---|
| **App logo** | Your brand logo (120×120px, reviewed by Google) |
| **App name** | The name shown as "to continue to [App Name]" |
| **Scopes** | What Google data your app is requesting access to |
| **Privacy Policy link** | Clickable link to your public privacy policy |

There are **two different views** depending on whether a user has signed in before:

### First-Time Sign-In (Consent Screen)
The full screen where the user sees your app name, logo, and must grant permissions. This is the most important screen — your logo appears prominently here.

### Returning User (Account Chooser)
A simplified "Choose an account" popup for users who have already consented. The logo appears small in the top-left corner. **This is Google's fixed design — you cannot change it.**

---

## 3. Scopes — Sensitive vs Non-Sensitive

OAuth scopes define what data your app reads from the user's Google account.

### Non-Sensitive Scopes (No full verification needed for branding)
| Scope | What it accesses |
|---|---|
| `openid` | Verifies the user's identity |
| `email` | The user's email address |
| `profile` | Name and profile picture |

If your app **only** uses these three scopes (like ShareMyApps), Google only requires **Branding Verification** — no full app review needed.

### Sensitive Scopes (Full verification required)
| Scope | What it accesses |
|---|---|
| `gmail.readonly` | Read Gmail messages |
| `drive` | Access Google Drive files |
| `calendar` | Read/write Calendar events |
| `contacts` | Access user's contacts |

Apps using sensitive scopes go through a much more rigorous review including a security assessment.

### Rule of Thumb
> **Only request the scopes your app actually needs.** Requesting more than you need triggers a harder review and makes users distrust your app.

---

## 4. The Four Verification Requirements

To pass Google's branding verification, you must satisfy all four:

```
✅ 1. Your homepage is live and clearly describes the app
✅ 2. Your privacy policy is comprehensive and covers Google data
✅ 3. Your logo meets Google's image specifications
✅ 4. You own and have verified your domain in Google Search Console
```

> **Note:** A demo video is also required when you submit for verification.

---

## 5. Step-by-Step: Homepage Requirements

Your app's homepage (e.g., `https://sharemyapps.in`) must:

### ✅ Must Have
- [ ] Be **fully functional** — not a blank page, "coming soon" page, or login-only page
- [ ] **Clearly identify** your app/brand name (ShareMyApps, etc.)
- [ ] **Describe the app's purpose** — what does it do? Who is it for?
- [ ] Contain a **visible, clickable Privacy Policy link**
- [ ] Be hosted on the **same authorized domain** listed in your GCP project

### ✅ Best Practice — Add a Footer
The easiest way to always show the Privacy Policy link is a site-wide footer:

```jsx
// components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4 text-xs text-muted">
        <img src={logo} alt="App logo" className="h-5 w-5" />
        <span className="font-semibold text-text">YourAppName</span>
        <span>© {new Date().getFullYear()}</span>
        <span>·</span>
        <Link to="/privacy-policy" className="underline hover:text-accent">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
```

Then only show it on public pages (hide it from logged-in dashboard pages):

```jsx
// App.jsx
const PUBLIC_FOOTER_PATHS = ['/', '/explore', '/login', '/register', '/privacy-policy'];

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  
  const showFooter = !loading && PUBLIC_FOOTER_PATHS.includes(location.pathname);

  return (
    <div>
      <Navbar />
      <main>{/* routes */}</main>
      {showFooter && <Footer />}
    </div>
  );
}
```

> **Why hide during loading?** If you show the footer during the initial auth check, it flashes visible and then disappears when the user gets redirected to their dashboard. Hide it by checking `!loading`.

---

## 6. Step-by-Step: Writing a Compliant Privacy Policy

This is the **most common reason apps fail verification**. Google's automated crawler visits your privacy policy URL and checks for sufficient content. A privacy policy that is too short or vague will be rejected.

### Required Sections

Your privacy policy **must** cover all of these:

| Section | What to include |
|---|---|
| **Introduction** | What the app is, what the policy covers |
| **Data Collected via Google** | Explicitly state: email + basic profile only. State what you do NOT request (Drive, Gmail, etc.) |
| **Data Collected Directly** | Registration form fields, profile info, content users create |
| **Data Collected Automatically** | IP address, browser info, cookies/localStorage |
| **How You Use the Data** | Auth, personalisation, security, notifications — be specific |
| **Legal Basis (GDPR)** | Contract, legitimate interests, consent, legal obligation |
| **Data Sharing** | Third-party processors (Cloudinary, MongoDB Atlas, etc.). State clearly: "We do NOT sell data" |
| **Data Retention** | How long you keep data. What happens on account deletion |
| **Security** | HTTPS, bcrypt hashing, JWT tokens, infrastructure (e.g., Cloud Run) |
| **Cookies** | What cookies/localStorage you use, what they do, no ad tracking |
| **User Rights** | Access, rectification, erasure, portability, objection |
| **Children's Privacy** | Not for under 13 |
| **Contact Info** | Email address for privacy inquiries |

### ❌ What Gets Rejected

```
❌ "We take your privacy seriously. We don't share your data."
   (Too vague — no specifics on what data is collected or how)

❌ A privacy policy on a 404 page
   (The URL must actually work and load content)

❌ A link to a generic privacy policy template
   (Must be specific to your app)

❌ URL typo: /privacy-policy.in instead of /privacy-policy
   (The URL in GCP console must exactly match your live URL)
```

### ✅ Setting Up the Route in React

```jsx
// App.jsx
import PrivacyPolicy from './pages/PrivacyPolicy';

<Route path="/privacy-policy" element={<PrivacyPolicy />} />
```

Then in GCP Console, set:
```
Application privacy policy link: https://yourdomain.com/privacy-policy
```

> ⚠️ **Critical:** The URL in GCP must exactly match your live URL. Double-check for typos.

---

## 7. Step-by-Step: Logo Requirements

Google reviews your logo separately from the branding text. Even after branding is verified, the logo goes through its own image review.

### Specifications

| Property | Requirement |
|---|---|
| **Format** | PNG, JPG, or BMP |
| **Dimensions** | Square — **120 × 120 px** recommended |
| **File size** | Maximum **1 MB** |
| **Content** | Your app's brand icon. No Google logos/trademarks. No text (app name is shown separately) |
| **Background** | Transparent or solid color both work |

### Resize Your Logo (PowerShell)

If your logo is larger than 120×120, resize it before uploading:

```powershell
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("path\to\logo.png")
$dst = New-Object System.Drawing.Bitmap(120, 120)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 120, 120)
$dst.Save("path\to\logo_120x120.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Done"
```

### Where to Upload
GCP Console → **Google Auth Platform** → **Branding** → **Change logo** → Upload the 120×120 file → Save

### Timeline
Logo review is **separate** from branding text verification and typically takes **1–3 business days** after submission.

---

## 8. Step-by-Step: Domain Verification

All domains listed in your GCP project's Authorized Domains must be verified in **Google Search Console**. This proves you actually own the domain.

### Steps

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **"Add property"**
3. Choose **"Domain"** type and enter: `yourdomain.com`
4. Google gives you a **TXT record** to add:
   ```
   Type:  TXT
   Name:  @  (or your domain root)
   Value: google-site-verification=abc123...
   TTL:   3600
   ```
5. Log into your **domain registrar** (GoDaddy, Namecheap, Google Domains, etc.) and add this TXT record to your DNS settings
6. Click **"Verify"** in Search Console (may take a few minutes to propagate)

> **Note:** The project owner or editor must perform this verification. Check that the Google account you use in Search Console matches an Owner/Editor in GCP.

---

## 9. Step-by-Step: Recording the Demo Video

Google requires a YouTube video that shows your app is real and legitimate. The video is reviewed by Google's team.

### What to Record

**Scene 1 — The Homepage (~30 seconds)**
- Open your live app URL in Chrome
- Scroll slowly through the homepage
- Show it's a real, functioning application

**Scene 2 — The Google Sign-In Flow (~45 seconds)**
- Click your "Sign in with Google" button
- The OAuth consent screen must be **clearly visible** on screen — this is the most important moment:
  - App name shown ("to continue to ShareMyApps")
  - App logo visible
  - Scopes listed (email + profile)
- Complete the sign-in with a real Google account

**Scene 3 — How Google Data is Used (~30 seconds)**
- After sign-in, show your profile/dashboard
- Show that only the name and email from Google are used
- Demonstrate the core functionality of the app

**Scene 4 — Privacy Policy (~15 seconds)**
- Show the footer with the Privacy Policy link
- Click it to confirm the page loads correctly

### Recording Tools

| Tool | How to use |
|---|---|
| **Windows Game Bar** | Press `Win + G` → click Record |
| **OBS Studio** | Free, professional. [obsproject.com](https://obsproject.com) |
| **Loom** | Chrome extension. Records and uploads instantly |

### Uploading to YouTube

1. Go to [youtube.com](https://youtube.com) → **Create → Upload video**
2. Set visibility to **Unlisted** (Google can watch it, but it won't appear in public search)
3. Copy the URL: `https://youtu.be/your-video-id`

### Video Tips
- 🔇 Silent is fine — no audio required
- 📺 Record at **1080p** — must be readable
- ⏱️ **2–3 minutes** ideal length
- The OAuth consent screen moment must be **fully legible** — zoom in if needed

---

## 10. Step-by-Step: Submitting for Verification

Once all four requirements are met:

### In GCP Console
1. Go to **Google Auth Platform** → **Branding**
2. Verify all fields are filled:
   - App name
   - App logo (uploaded)
   - Homepage URL
   - Privacy Policy URL (exact match to live URL)
3. Scroll to **Verification status** → Click **"View issues"** to see if any issues remain
4. If issues are listed, fix them and return
5. Click **"I have fixed the issues"** → Select this option → Click **"Proceed"**

### In the Verification Submission Form
When prompted for additional information:
- Paste your YouTube demo video URL
- Confirm your authorized domains
- Submit

### Timeline
| Stage | Typical Time |
|---|---|
| Branding text review | Same day to 24 hours (automated) |
| Logo review | 1–3 business days |
| Full app review (sensitive scopes) | 4–6 weeks |

---

## 11. After Verification — Publishing Your Branding

After Google verifies your branding, you will see:

```
✅ Your branding has been verified, but is not yet being shown to users.
   Publish it before the verified result expires in 7 days.
   [Publish branding]
```

> ⚠️ **You must click "Publish branding" within 7 days** or the verification expires and you have to resubmit.

After clicking Publish:

```
✅ Your branding has been verified and is being shown to users.
```

This means all users signing in with Google will now see your branded consent screen with no warnings.

---

## 12. What Users See Before vs After Verification

### Before Verification

```
⚠️  Google hasn't verified this app

sharemyapps.in wants to access your Google Account

This will allow sharemyapps.in to:
• See your primary Google Account email address
• See your personal info, including any personal info you've made publicly available

Make sure you trust sharemyapps.in

[Continue]  [Cancel]
```
> The red warning and "Google hasn't verified this app" text appears. Users are strongly discouraged from continuing.

### After Verification (Account Chooser — Returning Users)

```
Sign in with Google

[Small app logo]  Choose an account
                  to continue to ShareMyApps

  [User 1 avatar]  Full Stack Dev
                   email@gmail.com

  [Use another account]

Before using this app, you can review ShareMyApps's Privacy Policy and Terms of Service.
```
> Clean, trusted UI. No warnings. App name prominently shown.

### After Verification (Full Consent Screen — New Users)

```
[App logo]

ShareMyApps wants to access your Google Account

This will allow ShareMyApps to:
• See your primary Google Account email address
• See your personal info, including any personal info you've made publicly available

[Allow]  [Cancel]
```
> Professional, branded consent screen. No red warnings.

---

## 13. Common Rejection Reasons and Fixes

| Rejection Reason | Fix |
|---|---|
| "Privacy policy does not have sufficient content" | Rewrite with all required sections. Must be specific to your app and how Google data is used |
| "Privacy policy URL does not load" | Check for URL typos in GCP console. Ensure the page is live and not behind auth |
| "Homepage does not identify the application" | Make sure your app name is clearly visible on the homepage. Not just a login form |
| "Authorized domain not verified" | Verify the domain in Google Search Console with a TXT record |
| "Logo does not meet requirements" | Upload a square PNG at 120×120px, under 1MB, with no Google branding |
| "Demo video is private" | Set the YouTube video to Public or Unlisted |

---

## 14. How ShareMyApps Implements This

Here is a reference of how this project handled each requirement:

### Files Created/Modified

| File | Purpose |
|---|---|
| [`client/src/pages/PrivacyPolicy.jsx`](../../client/src/pages/PrivacyPolicy.jsx) | 13-section comprehensive privacy policy covering all Google API Services requirements |
| [`client/src/components/Footer.jsx`](../../client/src/components/Footer.jsx) | Sitewide footer with Privacy Policy link, shown only on public pages |
| [`client/src/App.jsx`](../../client/src/App.jsx) | Footer visibility logic — public paths only, hidden during auth loading |
| [`client/src/assets/logo_120x120.png`](../../client/src/assets/logo_120x120.png) | Logo resized to 120×120px for GCP upload |

### Key Decisions

**1. Footer only on public pages**
The footer is hidden on authenticated app pages (dashboard, profile, etc.) to keep the UI clean for logged-in users. It only appears on pages a guest or Google's crawler would visit.

**2. Hide footer during auth loading**
On page load, the app checks authentication status before deciding where to redirect. Showing the footer during this loading state causes a visible flash. Fix: check `!loading` from AuthContext before rendering the footer.

**3. Privacy Policy at `/privacy-policy`**
A simple, clean URL. The route is publicly accessible — no authentication required. This is critical because Google's crawler must be able to reach it.

**4. Comprehensive privacy policy**
Google's rejection stated "does not have sufficient content." The original policy was ~70 lines. The rewritten version covers 13 sections including GDPR legal bases, data retention timelines, security measures, third-party processors (Cloudinary, MongoDB Atlas), cookies, and user rights.

### GCP Console Settings (for reference)

```
Application name:         ShareMyApps
Application home page:    https://sharemyapps.in
Privacy policy link:      https://sharemyapps.in/privacy-policy
Terms of Service link:    (optional)
Authorized domains:       sharemyapps.in
                          sharemyapps-498401.web.app
                          sharemyapps-server-653466296307.us-central1.run.app
Developer contact email:  fullstacksolutions101@gmail.com
```

---

## Quick Reference Checklist

Use this before submitting for verification:

```
□ Homepage is live and describes the app clearly
□ Homepage has a visible Privacy Policy link (footer or nav)
□ Privacy Policy page is live at the URL configured in GCP
□ Privacy Policy URL in GCP exactly matches the live URL (no typos)
□ Privacy Policy covers: data collected from Google, how it's used, sharing, retention, security, user rights
□ Logo uploaded to GCP: square, 120×120px, under 1MB, PNG format
□ Domain verified in Google Search Console (DNS TXT record)
□ Demo video uploaded to YouTube (Unlisted or Public)
□ Demo video shows: homepage, Google sign-in flow, OAuth consent screen, app functionality
□ Clicked "I have fixed the issues" → Proceed in GCP Branding page
□ After approval: clicked "Publish branding" within 7 days
```

---

*This document was written based on real experience verifying the ShareMyApps OAuth app in September 2026. Google's verification process and UI may change — always check the [official Google OAuth verification guide](https://support.google.com/cloud/answer/13464321) for the latest requirements.*
