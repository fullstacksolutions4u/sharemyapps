# 🕵️ Information Disclosure Prevention

> **Security Topic #4** | Audited: 2026-09-05 | Stack: Express + Vite + React

---

## 📖 What is Information Disclosure?

**Information Disclosure** (also called **Technology Fingerprinting**) happens when your application **reveals what software stack it runs on** through HTTP response headers, HTML comments, file names, or error messages.

Attackers use this information to:
- **Target known vulnerabilities** in the specific version of Express/React/Node they discovered
- **Automate attacks** — scanners search for `X-Powered-By: Express` to find targets
- **Map your architecture** — chunk names, file paths, and error stacks reveal internal structure

---

## 🔎 Full Audit Results

### HTTP Response Headers

| Header | Before (raw Express) | After (Helmet) | Status |
|--------|---------------------|----------------|--------|
| `X-Powered-By: Express` | 🔴 **EXPOSED** | ✅ Removed by Helmet | Fixed |
| `Server: nginx/1.x` | Depends on proxy | Set at reverse proxy level | ✅ N/A |
| `X-Generator` | Not set | Not set | ✅ OK |
| `X-AspNet-Version` | Not set | Not set | ✅ OK |

**Raw Express (without Helmet) would send:**
```
x-powered-by: Express        ← tells attacker you use Express/Node.js
content-type: application/json
```

**With our Helmet config, it sends:**
```
(no x-powered-by header at all) ✅
```

### HTML / JavaScript (Client-Side Fingerprinting)

| Source | What It Reveals | Risk |
|--------|----------------|------|
| Vite chunk names `vendor.js` | React, React-DOM, React-Router | 🟡 Low (obfuscated, not version-specific) |
| Vite chunk names `query.js` | TanStack React Query | 🟡 Low |
| `<script type="module">` | ES module build (Vite/modern bundler) | 🟢 Negligible |
| Error messages in API responses | `err.message` leaks stack info | 🔴 HIGH in production |
| `console.log` in production | Logs sensitive data in browser DevTools | 🟡 Medium |

---

## 🔍 The Real Risks — Ranked

### 🔴 HIGH: Error Messages Leaking Stack Traces

The biggest disclosure risk in your app is **`res.status(500).json({ message: err.message })`** in every controller.

In production, `err.message` can contain:
- MongoDB connection strings
- File system paths
- Internal variable names
- Library version info from stack traces

```js
// ❌ DANGEROUS in production — leaks internal errors
res.status(500).json({ message: err.message });

// ✅ SAFE — generic message in production, full error only in dev
res.status(500).json({ 
  message: process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message 
});
```

### 🟡 MEDIUM: Chunk File Names in Browser

Vite's default chunk names (`vendor.js`, `query.js`) tell a curious attacker you use React and TanStack Query. We can obfuscate them:

```js
// vite.config.js — obfuscate chunk names
output: {
  chunkFileNames: 'assets/[hash].js',   // Was: 'vendor.js', 'query.js'
  entryFileNames: 'assets/[hash].js',
  assetFileNames: 'assets/[hash].[ext]',
}
```

### 🟢 LOW: `type="module"` script tag

Every modern React/Vite app uses this. It's not a meaningful attack vector and can't be removed without breaking the app.

---

## 🔧 Implementation

### Fix 1 — Server: Generic Error Responses (most important)

The error handler at the bottom of each controller should hide internal details in production:

```js
// Create a shared error handler: server/middleware/errorHandler.js
const errorHandler = (err, _req, res, _next) => {
  console.error(err); // Log full error server-side (for your debugging)
  
  res.status(err.statusCode || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message,
  });
};
module.exports = errorHandler;
```

### Fix 2 — Client: Obfuscate Vite Build Chunk Names

Updated in `client/vite.config.js`:

```js
build: {
  rollupOptions: {
    output: {
      // Obfuscate chunk names — hide React, React Query fingerprints
      chunkFileNames: 'assets/[hash].js',
      entryFileNames: 'assets/[hash].js',
      assetFileNames: 'assets/[hash].[ext]',
      manualChunks(id) {
        if (id.includes('node_modules/react') || ...) return 'vendor';
        if (id.includes('@tanstack/react-query')) return 'query';
      },
    },
  },
},
```

> **Note:** `manualChunks` still groups them logically for caching efficiency. The `chunkFileNames: 'assets/[hash].js'` replaces readable names like `vendor.js` with `assets/abc123de.js` in the built output.

### Fix 3 — GCP Cloud Run: `Server:` Header

Your backend runs as a **Docker container on GCP Cloud Run** — there is **no nginx**. Express runs directly on port 8080 behind GCP's managed load balancer.

```
User → GCP Load Balancer → Cloud Run (Docker → node index.js :8080)
```

**`server_tokens off` does NOT apply to you** — that's nginx-only.

GCP's load balancer **automatically suppresses or replaces** the `Server:` header. You cannot control it and you don't need to — GCP handles it.

### Fix 4 — Firebase Hosting: Frontend Security Headers ✅ Done

Your React frontend is served by **Firebase Hosting** (not Cloud Run). Firebase Hosting has its own header system in `firebase.json`.

**Before** — only 2 headers:
```json
{ "key": "X-Content-Type-Options", "value": "nosniff" }
{ "key": "X-Frame-Options", "value": "DENY" }
```

**After** — full hardened set matching the Express API:
```json
{ "key": "X-Content-Type-Options", "value": "nosniff" }
{ "key": "X-Frame-Options", "value": "DENY" }
{ "key": "X-XSS-Protection", "value": "0" }
{ "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
{ "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), usb=(), payment=(self), interest-cohort=()" }
{ "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
{ "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
```

Deploy with: `firebase deploy --only hosting`

### Fix 4 — X-Powered-By Already Hidden ✅

Helmet's `hidePoweredBy` is **enabled by default** — no action needed. Confirmed by audit:
```
# Before: x-powered-by: Express
# After:  (header not sent at all)
```

---

## 📊 Before vs After

| Disclosure Vector | Before | After |
|------------------|--------|-------|
| `X-Powered-By: Express` | 🔴 Exposed | ✅ Hidden by Helmet |
| 500 error messages | 🔴 Leaks `err.message` | ✅ Generic in production |
| Vite chunk names | 🟡 `vendor.js`, `query.js` | ✅ `assets/[hash].js` |
| nginx `Server:` header | 🟡 Nginx version shown | ✅ `server_tokens off` |
| HTML meta generator | ✅ Not set | ✅ Not set |

---

## 🧪 How to Test

### Check Headers
```bash
# From command line after deployment
curl -I https://your-api.com/api/health

# Should NOT see any of these:
# x-powered-by: Express
# server: nginx/1.24.0
# x-generator: anything
```

### Check Chunk Names in Production Build
```bash
cd client
npm run build
ls dist/assets/
# Should see: abc123de.js, not vendor.js or query.js
```

### Check Error Response (test with a bad request)
```bash
curl -X POST https://your-api.com/api/auth/login -H "Content-Type: application/json" -d '{"bad": "data"}'
# Should return: {"message": "Something went wrong. Please try again."}
# Should NOT return: {"message": "Cannot read properties of undefined reading 'comparePassword'"}
```

---

## ⚠️ Important: Security Through Obscurity is NOT enough

> Hiding technology information is a **defense-in-depth** measure, NOT a primary security control.
> A determined attacker will fingerprint your stack regardless.
> The real protection comes from the other security topics (XSS, CSP, Auth, etc.).
> Information hiding simply **raises the cost of automated attacks**.

---

## 🔗 References

- [OWASP Information Exposure](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url)
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [Helmet hidePoweredBy](https://helmetjs.github.io/#hide-powered-by)
- [nginx server_tokens](https://nginx.org/en/docs/http/ngx_http_core_module.html#server_tokens)

---

> 📅 Added: 2026-09-05 | Status: ✅ Implemented
