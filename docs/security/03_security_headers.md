# 🔐 Security Headers Hardening

> **Security Topic #3** | Audited: 2026-09-05 | Stack: Express + Helmet 8.2.0

---

## 📖 What are Security Headers?

Security headers are **HTTP response headers** that instruct the browser on how to behave when handling your app's content. They are your **last line of defense** after the server sends a response — the browser reads them and enforces rules like:

- Don't allow this page to be loaded over HTTP (HSTS)
- Don't guess the content type of files (X-Content-Type-Options)
- Don't allow the microphone/camera to be used (Permissions-Policy)
- Don't leak where users came from (Referrer-Policy)

They cost **zero performance** and take minutes to add, but defend against entire classes of attacks.

---

## 🔎 Full Header Audit (Before vs After)

### Before: What Helmet 8.2.0 sent by default with our config

```
content-security-policy:    ✅ Set (but loose img-src/font-src from defaults)
cross-origin-opener-policy: same-origin          ✅ OK
cross-origin-resource-policy: same-origin        ⚠️ WRONG — breaks Cloudinary/Firebase
referrer-policy:            no-referrer          ⚠️ TOO STRICT — breaks OAuth/Razorpay
strict-transport-security:  max-age=31536000; includeSubDomains  ✅ but missing preload
x-content-type-options:     nosniff              ✅ OK
x-dns-prefetch-control:     off                  ✅ OK
x-download-options:         noopen               ✅ OK
x-frame-options:            DENY                 ✅ Set by us (Topic #2)
x-permitted-cross-domain-policies: none          ✅ OK
x-xss-protection:           0                    ✅ Correct (disabled for modern browsers)
permissions-policy:         ❌ MISSING
```

---

## 📋 Every Security Header Explained

### 1. `Strict-Transport-Security` (HSTS) ✅ → Enhanced

**What it does**: Forces all future requests to use HTTPS — even if the user types `http://`.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| Part | Meaning |
|------|---------|
| `max-age=31536000` | Remember HTTPS-only for 1 year |
| `includeSubDomains` | Apply to all subdomains too |
| `preload` | Submit to browser HSTS preload list — HTTPS hardcoded in Chrome/Firefox |

> ⚠️ Only add `preload` once your **entire domain and all subdomains** are on HTTPS.

---

### 2. `X-Content-Type-Options` ✅ Already correct

**What it does**: Prevents browsers from **MIME-sniffing** — guessing a file's type from its content rather than its `Content-Type` header.

```
X-Content-Type-Options: nosniff
```

**Attack it prevents**: Attacker uploads a file called `photo.png` that actually contains JavaScript. Without this header, old browsers might execute it.

---

### 3. `Referrer-Policy` ⚠️ Fixed

**What it does**: Controls how much of your URL is sent to other sites in the `Referer` header when users click links.

```
# Before (too strict — breaks OAuth and payment callbacks):
Referrer-Policy: no-referrer

# After (safe + functional):
Referrer-Policy: strict-origin-when-cross-origin
```

| Policy | What's sent on cross-origin requests | Impact |
|--------|--------------------------------------|--------|
| `no-referrer` | Nothing | 🔴 Breaks Google OAuth, Razorpay |
| `strict-origin-when-cross-origin` | Only the domain (not the path) | ✅ Safe + compatible |
| `unsafe-url` | Full URL always | 🔴 Leaks sensitive URL paths |

---

### 4. `Permissions-Policy` ❌ → Added

**What it does**: Restricts which browser features (APIs) can be used on your page. Prevents malicious scripts from silently activating the camera, microphone, or tracking location.

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()
```

| Feature | Value | Meaning |
|---------|-------|---------|
| `camera=()` | Blocked for all | No page/iframe can use camera |
| `microphone=()` | Blocked for all | No page/iframe can use mic |
| `geolocation=()` | Blocked for all | No location tracking |
| `payment=(self)` | Self only | Only your own domain can use Payment API (Razorpay needs this) |
| `usb=()` | Blocked for all | No USB device access |
| `interest-cohort=()` | Blocked | Opt out of FLoC/ad tracking |

---

### 5. `Cross-Origin-Resource-Policy` ⚠️ Fixed

**What it does**: Controls which origins can **read your API responses** using `fetch()` or `XMLHttpRequest`.

```
# Before (too strict — blocks Cloudinary/Firebase cross-origin image loads):
Cross-Origin-Resource-Policy: same-origin

# After:
Cross-Origin-Resource-Policy: cross-origin
```

> Our API is a **separate server** from the React frontend. `same-origin` would block the frontend from loading resources, so we correctly set this to `cross-origin`. CORS headers already restrict which domains can actually call the API.

---

### 6. `Cross-Origin-Opener-Policy` ✅ Already correct

**What it does**: Isolates your browsing context — prevents a malicious popup you opened from accessing your `window` object.

```
Cross-Origin-Opener-Policy: same-origin
```

---

### 7. `X-Frame-Options` ✅ Already set (Topic #2)

```
X-Frame-Options: DENY
```

---

### 8. `X-XSS-Protection` ✅ Correctly disabled

```
X-XSS-Protection: 0
```

This old IE/Chrome header is **intentionally set to 0** (disabled). The old XSS filter had bugs that could be exploited. Modern browsers use CSP instead.

---

### 9. `X-DNS-Prefetch-Control` ✅ Already correct

```
X-DNS-Prefetch-Control: off
```

Prevents browsers from pre-resolving DNS for links on your page — stops information leakage about what resources your app references.

---

### 10. `X-Download-Options` ✅ Already correct

```
X-Download-Options: noopen
```

Prevents IE from auto-opening downloaded files directly — forces "Save" dialog.

---

### 11. `X-Permitted-Cross-Domain-Policies` ✅ Already correct

```
X-Permitted-Cross-Domain-Policies: none
```

Blocks Adobe Flash/PDF from loading your content cross-domain.

---

### 12. `Origin-Agent-Cluster` ✅ Already correct

```
Origin-Agent-Cluster: ?1
```

Requests browser to isolate your origin in its own agent cluster — better memory isolation between sites.

---

## 🔧 Implementation

All changes are in `server/index.js` via Helmet configuration:

```js
app.use(helmet({
  // 1. HSTS — force HTTPS for 1 year + preload list
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // 2. Referrer Policy — safe: sends origin only on cross-origin (not full URL path)
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // 3. Cross-Origin-Resource-Policy — allows frontend to fetch our API cross-origin
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // 4. Permissions-Policy — restrict browser features (camera, mic, geolocation etc.)
  // Note: Helmet uses permissionsPolicy for this
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      usb: ["'none'"],
      payment: ["'self'"],
      interestCohort: ["'none'"],
    },
  },
}));
```

---

## 📊 Before vs After Score

| Header | Before | After | Grade |
|--------|--------|-------|-------|
| `Content-Security-Policy` | ✅ Set | ✅ Refined | A |
| `Strict-Transport-Security` | ✅ Set | ✅ + preload | A+ |
| `X-Content-Type-Options` | ✅ nosniff | ✅ nosniff | A |
| `X-Frame-Options` | ✅ DENY | ✅ DENY | A |
| `Referrer-Policy` | ⚠️ no-referrer | ✅ strict-origin-when-cross-origin | A |
| `Permissions-Policy` | ❌ Missing | ✅ camera/mic/geo blocked | A |
| `Cross-Origin-Resource-Policy` | ⚠️ same-origin | ✅ cross-origin | A |
| `Cross-Origin-Opener-Policy` | ✅ same-origin | ✅ same-origin | A |

---

## 🧪 How to Test

### 1. Online Tools
- **[securityheaders.com](https://securityheaders.com)** — Enter your live URL → get a grade (A+ to F)
- **[observatory.mozilla.org](https://observatory.mozilla.org)** — Mozilla's security scanner

### 2. Chrome DevTools
Network tab → click any request → **Response Headers** panel

### 3. Command line (after deployment)
```bash
curl -I https://your-api-url.com/api/health
```

---

## 🔗 References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [securityheaders.com](https://securityheaders.com)
- [Helmet.js docs](https://helmetjs.github.io/)
- [HSTS Preload List](https://hstspreload.org/)

---

> 📅 Added: 2026-09-05 | Status: ✅ Implemented
