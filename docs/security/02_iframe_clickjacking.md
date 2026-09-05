# 🖼️ iFrame Attack Prevention (Clickjacking)

> **Security Topic #2** | Stack: React 19 + Vite (Frontend) · Express + Helmet (Backend)

---

## 📖 What is an iFrame Attack?

An **iFrame attack** (most commonly called **Clickjacking**) works like this:

1. An attacker creates a fake/malicious webpage
2. They **embed your app invisibly** inside an `<iframe>` on their page
3. The iframe is positioned over a deceptive button on the attacker's page
4. When the victim **clicks what appears to be the attacker's button**, they are actually clicking a button inside **your app** (e.g., "Transfer money", "Delete account", "Approve access")

The user never knows they're interacting with your app.

### 🎯 Real Attack Example

```
[Attacker's fake page]
┌──────────────────────────────────────────┐
│  "Click here to claim your free prize!"  │
│                                          │
│    ┌────────────────────────────────┐    │
│    │ [INVISIBLE iframe of YOUR app] │    │ ← opacity: 0.001
│    │     [Delete Account button]    │    │ ← positioned over "claim prize"
│    └────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

The victim thinks they're clicking "claim prize" — they're actually clicking "Delete Account" on ShareMyApps.

---

## 🧠 Types of iFrame Attacks

| Attack | How it Works | Risk |
|--------|-------------|------|
| **Clickjacking** | Invisible iframe over deceptive content | 🔴 HIGH |
| **Likejacking** | Tricking user into Facebook "like" | 🟡 MEDIUM |
| **Cursorjacking** | Showing fake cursor offset from real one | 🟡 MEDIUM |
| **Filejacking** | Tricking user into file upload/download | 🟡 MEDIUM |
| **Form injection via iframe** | Injecting malicious iframes into your own app | 🔴 HIGH |

---

## 🔍 Where Your App Was Vulnerable

### ❌ Before (Missing `X-Frame-Options` + missing `frame-ancestors`)

```js
// server/index.js — OLD (completely disabled CSP including frame protection)
app.use(helmet({ contentSecurityPolicy: false }));
```

Any attacker could embed `https://sharemyapps.in` in their iframe:
```html
<!-- Anyone could do this on their website -->
<iframe src="https://sharemyapps.in" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
```

### ✅ After (Two layers of frame protection)

Your app now sends **two defense headers** on every response:

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

---

## 🛡️ The 3-Layer iFrame Defense Strategy

```
Layer 1: X-Frame-Options header         → Blocks legacy browsers (IE, old browsers)
Layer 2: CSP frame-ancestors directive  → Modern, stronger version of X-Frame-Options
Layer 3: sandbox attribute on your own iframes → Locks down what embedded content can do
```

---

## 🔧 Implementation Details

### Layer 1 + 2 — Server Headers (via Helmet)

Added to `server/index.js`:

```js
app.use(helmet({
  // Clickjacking Defense — Layer 1: X-Frame-Options
  frameguard: {
    action: 'deny',      // Completely block embedding in any iframe
    // Use 'sameorigin' if you need to iframe your own app within itself
  },

  contentSecurityPolicy: {
    directives: {
      // ...other directives...

      // Clickjacking Defense — Layer 2: CSP frame-ancestors
      // 'none' = nobody can embed this app in an iframe
      frameAncestors: ["'none'"],

      // Controls what iframes YOUR app can load (Razorpay, Google OAuth)
      frameSrc: [
        "https://accounts.google.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ],
    }
  }
}));
```

> **`frameSrc` vs `frame-ancestors`** — these are opposites:
> - `frameSrc` = what iframes **your app** is allowed to load (outbound)
> - `frame-ancestors` = who is allowed to embed **your app** in an iframe (inbound)

### Layer 3 — Sandbox Your Own iframes

Your app has one `<iframe>` in `Profile.jsx` for CV preview (Google Drive embed). Adding `sandbox` limits what that embedded content can do:

```jsx
// Profile.jsx — CV Preview iframe
<iframe
  src={resumeEmbedUrl}
  title="CV Preview"
  className="w-full h-full"
  frameBorder="0"
  // sandbox: restrict what the embedded Google Drive doc can do
  sandbox="allow-scripts allow-same-origin allow-popups"
  // referrerPolicy: don't leak your app URL to Google Drive
  referrerPolicy="strict-origin"
/>
```

#### What each `sandbox` value means:

| Sandbox Value | What it allows | Without it |
|--------------|---------------|------------|
| `allow-scripts` | Run JavaScript inside the iframe | iFrame is completely static |
| `allow-same-origin` | Treat iframe as same origin (needed for Google Drive preview) | Google Drive won't render |
| `allow-popups` | Let Google Drive open links in new tab | All links blocked |
| ❌ `allow-forms` | NOT included — blocks form submission from iframe | Prevents phishing forms |
| ❌ `allow-top-navigation` | NOT included — blocks redirecting your page | Prevents iframe hijacking your URL |

---

## 📊 Before vs After

| Protection | Before | After |
|-----------|--------|-------|
| `X-Frame-Options` | ❌ Not sent | ✅ `DENY` |
| `frame-ancestors` CSP | ❌ Not set | ✅ `'none'` |
| Own iframes sandboxed | ❌ No sandbox | ✅ `sandbox` with safe allowlist |
| referrerPolicy on iframes | ❌ Not set | ✅ `strict-origin` |

---

## 🧪 How to Test

### Test 1: Can attackers embed your app?

Create a test HTML file and open it in a browser:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Clickjacking Test</h1>
  <iframe src="https://your-app-url.com" width="800" height="600"></iframe>
</body>
</html>
```
**Expected**: Browser shows "Refused to display ... in a frame because it set 'X-Frame-Options' to 'deny'."

### Test 2: Check response headers

In Chrome DevTools → Network → any request → Response Headers:
```
x-frame-options: DENY
content-security-policy: ... frame-ancestors 'none' ...
```

### Test 3: Online Tools
- [Security Headers Scanner](https://securityheaders.com) — checks all your headers
- [ClickJacking Tester](https://clickjacker.io) — tests clickjacking specifically

---

## ⚠️ Exception: When You NEED to Allow iFraming

If you ever need to allow your app to be embedded in a specific trusted site (e.g., a partner site):

```js
// Allow ONLY a specific trusted origin to embed your app:
frameAncestors: ["'self'", "https://trusted-partner.com"],
// frameguard: { action: 'sameorigin' }
```

**Never use `frameAncestors: ["*"]`** — that defeats the entire protection.

---

## 🔗 References

- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
- [Helmet.js frameguard docs](https://helmetjs.github.io/#frameguard)

---

> 📅 Added: 2026-09-05 | Status: ✅ Implemented
