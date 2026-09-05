# 🛡️ XSS (Cross-Site Scripting) Prevention

> **Security Topic #1** | Stack: React 19 + Vite (Frontend) · Express + MongoDB (Backend)

---

## 📖 What is XSS?

**Cross-Site Scripting (XSS)** is an attack where a malicious user injects JavaScript code into your web application. When other users view that content, the injected script runs **in their browser** — giving the attacker access to:

- 🍪 Session cookies / JWT tokens
- 🔑 Saved passwords or form data
- 🖥️ Full control over what the page renders
- 📡 Ability to make API calls on the victim's behalf

---

## 🧠 3 Types of XSS You Must Know

| Type | How it Works | Example |
|------|-------------|---------|
| **Stored XSS** | Malicious script is saved in the DB and served to all users | User submits `<script>alert(1)</script>` as their bio |
| **Reflected XSS** | Script is injected via URL query param and reflected in the response | `https://yoursite.com/search?q=<script>...` |
| **DOM-based XSS** | Script is injected directly into the DOM using JS without going to the server | `element.innerHTML = location.hash` |

---

## 🔍 Where Your App is Vulnerable

### Frontend (React)
| Risk Area | Code Pattern | Risk Level |
|-----------|-------------|------------|
| `dangerouslySetInnerHTML` | Rendering raw HTML from API/user data | 🔴 HIGH |
| `eval()` / `new Function()` | Dynamic code execution | 🔴 HIGH |
| Setting `innerHTML` directly in refs | `ref.current.innerHTML = data` | 🔴 HIGH |
| URL params rendered without sanitization | `location.search` injected to DOM | 🟡 MEDIUM |
| User-supplied `href` / `src` values | `href={userInput}` | 🟡 MEDIUM |

### Backend (Express)
| Risk Area | Code Pattern | Risk Level |
|-----------|-------------|------------|
| Storing unsanitized HTML in MongoDB | No sanitization on text fields | 🔴 HIGH |
| Missing Content-Security-Policy header | `helmet({ contentSecurityPolicy: false })` | 🔴 HIGH |
| API responses echoing raw user input | Reflecting query params in JSON | 🟡 MEDIUM |
| Missing `httpOnly` cookie flag | JWT in accessible cookie | 🟡 MEDIUM |

> ⚠️ **Found in your code**: `server/index.js` line 43:
> ```js
> app.use(helmet({ contentSecurityPolicy: false }));
> ```
> **CSP is disabled!** This is the #1 XSS defense header and must be enabled.

---

## ✅ The 5-Layer XSS Defense Strategy

```
Layer 1: React auto-escaping (FREE - already working)
Layer 2: Input sanitization on the server (DOMPurify / sanitize-html)
Layer 3: Content Security Policy (CSP) HTTP headers
Layer 4: HTTPOnly + Secure + SameSite cookies
Layer 5: Avoid dangerous DOM APIs
```

---

## 🔧 Implementation Guide

### Layer 1 — React Auto-Escaping (Already Active ✅)

React **automatically escapes** all JSX expressions. This means:

```jsx
// ✅ SAFE — React escapes this automatically
const userBio = "<script>alert('hacked')</script>";
return <p>{userBio}</p>;
// Renders as text, NOT as HTML. You're safe here.

// ❌ DANGEROUS — bypasses React's escaping
return <p dangerouslySetInnerHTML={{ __html: userBio }} />;
```

**Rule**: Never use `dangerouslySetInnerHTML` with raw user data. If you must render HTML (e.g., rich text from an editor), sanitize it first with DOMPurify (see Layer 2).

---

### Layer 2 — Sanitize Input on the Backend

Install `sanitize-html` on the server to strip dangerous tags from any text stored in MongoDB:

```bash
# Run inside /server
npm install sanitize-html
```

Create `server/utils/sanitize.js`:

```js
// server/utils/sanitize.js
const sanitizeHtml = require('sanitize-html');

// Strict: strip ALL HTML (for plain text fields like name, bio, title)
const sanitizeText = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],        // No HTML allowed
    allowedAttributes: {},  // No attributes allowed
  }).trim();
};

// Lenient: allow safe formatting tags (for rich text fields like descriptions)
const sanitizeRichText = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
    },
    // Force safe values on links
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: attribs.href || '#',
          target: '_blank',
          rel: 'noopener noreferrer',  // Prevents tab-napping
        },
      }),
    },
  });
};

module.exports = { sanitizeText, sanitizeRichText };
```

Use it in your controllers:

```js
// Example: server/controllers/userController.js
const { sanitizeText, sanitizeRichText } = require('../utils/sanitize');

// Before saving to MongoDB:
const updateUser = async (req, res) => {
  const { name, bio, website } = req.body;

  const safeData = {
    name: sanitizeText(name),           // Plain text
    bio: sanitizeRichText(bio),         // May have formatting
    website: sanitizeUrl(website),      // URL-specific (see Layer 5)
  };

  await User.findByIdAndUpdate(req.user._id, safeData);
  res.json({ success: true });
};
```

---

### Layer 3 — Content Security Policy (CSP) Headers

> **Most critical fix!** CSP tells the browser which sources of scripts/styles are trusted. Even if XSS happens, CSP prevents the script from running.

Update `server/index.js` line 43 to **enable CSP**:

```js
// ❌ BEFORE (CSP disabled — very dangerous)
app.use(helmet({ contentSecurityPolicy: false }));

// ✅ AFTER (CSP enabled with proper policy)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Add only trusted CDNs you actually use:
        "https://apis.google.com",
        "https://accounts.google.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",  // Needed for TailwindCSS inline styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",                        // Base64 images
        "blob:",
        "https://res.cloudinary.com",   // Your Cloudinary images
        "https://lh3.googleusercontent.com", // Google profile pics
        "https://firebasestorage.googleapis.com",
      ],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL,
        "https://api.razorpay.com",
        "https://accounts.google.com",
      ],
      frameSrc: [
        "https://accounts.google.com",  // Google OAuth popup
        "https://api.razorpay.com",
      ],
      objectSrc: ["'none'"],            // Block Flash/plugins
      upgradeInsecureRequests: [],      // Force HTTPS
    },
  },
  crossOriginEmbedderPolicy: false,     // Needed for Cloudinary images
}));
```

---

### Layer 4 — Secure Cookies

Ensure JWT / session cookies are protected. Check `server/middleware/auth.js` or wherever you set cookies:

```js
// ✅ Secure cookie config
res.cookie('token', jwtToken, {
  httpOnly: true,     // JS cannot access this cookie (blocks XSS theft)
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'strict', // Prevents CSRF cross-site submission
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in ms
});
```

| Flag | What it does |
|------|-------------|
| `httpOnly: true` | Cookie invisible to `document.cookie` — XSS can't steal it |
| `secure: true` | Only sent over HTTPS |
| `sameSite: 'strict'` | Not sent on cross-site requests (blocks CSRF too) |

---

### Layer 5 — Sanitize URLs & Avoid Dangerous DOM APIs

#### Validate URLs before using as `href`

```js
// server/utils/sanitize.js — add this function
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols — blocks javascript: URLs
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return ''; // Invalid URL
  }
};
```

#### Frontend: Never use `innerHTML` with user data

```jsx
// ❌ DANGEROUS
ref.current.innerHTML = userContent;
document.getElementById('bio').innerHTML = user.bio;

// ✅ SAFE — use textContent for plain text
ref.current.textContent = userContent;

// ✅ SAFE — use React JSX (auto-escaped)
return <p>{user.bio}</p>;

// ✅ SAFE — if you MUST render HTML, sanitize first with DOMPurify
import DOMPurify from 'dompurify';
return <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />;
```

#### Install DOMPurify on client (for rich text rendering only):

```bash
# Run inside /client
npm install dompurify
```

---

## 📋 XSS Prevention Checklist for Your App

### Backend ✅
- [ ] Install `sanitize-html` → `npm install sanitize-html` (in `/server`)
- [ ] Create `server/utils/sanitize.js` with `sanitizeText` and `sanitizeRichText`
- [ ] Apply sanitization in controllers before saving to MongoDB
- [ ] Enable Helmet CSP in `server/index.js` (remove `contentSecurityPolicy: false`)
- [ ] Verify cookies use `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- [ ] Add `sanitizeUrl()` for any user-supplied URL fields

### Frontend ✅
- [ ] Search codebase for `dangerouslySetInnerHTML` — sanitize every usage with DOMPurify
- [ ] Search codebase for `innerHTML` assignments — replace with `textContent` or JSX
- [ ] Install `dompurify` → `npm install dompurify` (in `/client`, only if needed)
- [ ] Never use `eval()` or `new Function()` with user input
- [ ] For user-supplied links, validate protocol is `http://` or `https://`

---

## 🧪 How to Test Your XSS Protection

### Manual Test Payloads
Try submitting these in any user input field (name, bio, comment, etc.):

```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<svg onload=alert('XSS')>
"><script>alert(document.cookie)</script>
```

**Expected result**: All of these should be stored as plain text or stripped — never execute an alert.

### Test CSP Header
Open Chrome DevTools → Network → click any request → look for the response header:
```
Content-Security-Policy: default-src 'self'; ...
```
If the header is present, CSP is working.

---

## 📊 Before vs After

| Area | Before | After |
|------|--------|-------|
| CSP Header | ❌ Disabled | ✅ Strict policy |
| User input stored in DB | ❌ Raw HTML possible | ✅ Sanitized |
| Cookie access from JS | ⚠️ Depends on config | ✅ httpOnly blocked |
| Rich text rendering | ❌ Unsafe `innerHTML` | ✅ DOMPurify sanitized |
| `javascript:` URLs | ❌ Accepted | ✅ Blocked by sanitizeUrl |

---

## 🔗 References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [sanitize-html npm](https://www.npmjs.com/package/sanitize-html)
- [Helmet.js CSP docs](https://helmetjs.github.io/)

---

> 📅 Added: 2026-09-05 | Status: 📋 Ready to Implement
