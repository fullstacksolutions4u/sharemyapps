# 🛡️ CORS (Cross-Origin Resource Sharing) Hardening

> **Security Topic #6** | Stack: Express + MongoDB (Backend) | Status: ✅ Implemented

---

## 📖 What is CORS?

**Cross-Origin Resource Sharing (CORS)** is a security feature implemented by browsers that blocks web pages from making requests to a different domain than the one that served the web page. 

For example, if your React app is hosted on `https://sharemyapps.web.app`, the browser will automatically block any API calls to `https://sharemyapps-server.run.app` **unless** the server explicitly returns headers saying, "Yes, I allow `https://sharemyapps.web.app` to talk to me."

---

## 🔒 What We Hardened

We updated `server/index.js` to implement a strict, production-ready CORS policy:

### 1. Reliable Origin Exact-Matching
```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // Strip trailing slashes
```
- **The Risk**: If you set `ALLOWED_ORIGINS="https://myapp.com/"` (with a slash at the end), the browser sends `Origin: https://myapp.com` (no slash). The exact match would fail, blocking legitimate traffic.
- **The Fix**: We now automatically strip trailing slashes when starting the server to ensure exact-matching is bulletproof.

### 2. Strict HTTP Methods
```js
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
```
- **The Risk**: Allowing any HTTP method (`*`) opens the door to obscure attacks using non-standard methods (like `TRACE` or `TRACK`).
- **The Fix**: We explicitly whitelisted only the standard REST API methods your app actually uses.

### 3. Strict Allowed Headers
```js
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
```
- **The Risk**: Allowing any header allows attackers to bypass certain WAF rules or inject malicious payloads into custom HTTP headers.
- **The Fix**: We explicitly allow only the headers your frontend needs to send.

### 4. Legacy Browser Support (Options Success Status)
```js
optionsSuccessStatus: 200
```
- **The Fix**: Modern browsers expect a `204 No Content` status code for CORS preflight requests (the `OPTIONS` request browsers send before a `POST`). However, some older browsers (like IE11) and Smart TVs treat `204` as an error. We force it to return `200 OK` to ensure maximum compatibility.

---

## ✅ How to Verify

When a browser makes a request to your API, the response will now include:
- `Access-Control-Allow-Origin: https://sharemyapps.web.app` (if matched)
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept`
- `Access-Control-Allow-Credentials: true`
