# 🛡️ CSRF (Cross-Site Request Forgery) Prevention

> **Security Topic #7** | Stack: React 19 + Vite (Frontend) · Express + MongoDB (Backend) | Status: ✅ Implemented

---

## 📖 What is CSRF?

**Cross-Site Request Forgery (CSRF)** is an attack that forces an authenticated user to execute unwanted actions on a web application in which they're currently authenticated.

**How it works (Traditional CSRF):**
1. You log into `https://sharemyapps.web.app` and get an authentication cookie.
2. The cookie is configured with `SameSite=None` (which your app previously used).
3. You visit a malicious site `https://evil.com`.
4. `evil.com` automatically submits a hidden `<form method="POST" action="https://sharemyapps-server.run.app/api/user/delete">`.
5. Because the request goes to your backend, your browser automatically attaches the authentication cookie.
6. The backend receives the cookie, thinks you requested it, and deletes your account.

---

## 🔒 What We Found in ShareMyApps

Your app was highly vulnerable to CSRF because:
1. It used `res.cookie('token', token, { sameSite: 'none', secure: true })` to store authentication tokens.
2. The `auth.js` middleware explicitly checked for `req.cookies.token` **first**, before falling back to the `Authorization` header.

Because `SameSite=None` was explicitly set (required for cross-domain cookies between your Firebase frontend and GCP backend), browsers would automatically attach this cookie to any malicious request originating from an attacker's site.

---

## ✅ How We Fixed It (Stateless API Defense)

Instead of implementing complex CSRF tokens (like double-submit cookies or the `csurf` library), we implemented the **gold standard for modern REST APIs**: we completely removed cookie-based authentication.

### The Fix

1. **Removed Cookie Extraction**: We updated `server/middleware/auth.js` to strictly and exclusively rely on the `Authorization: Bearer <token>` HTTP header. It completely ignores `req.cookies.token`.
2. **Removed Cookie Setting**: We removed all `res.cookie()` and `res.clearCookie()` logic from `server/controllers/authController.js`.
3. **Frontend Compatibility**: Your frontend was **already immune** because `client/src/api/axios.js` successfully pulls the token from `localStorage` and manually attaches it to the `Authorization` header.

### Why this stops CSRF completely:
Browsers **do not** automatically append custom headers (like `Authorization`) to cross-origin requests, not even for simple `<form>` submissions. 

For an attacker to include the `Authorization` header on a malicious request from `evil.com`, they would have to use JavaScript (`fetch` or `axios`). But if they use JavaScript to set a custom header, the browser triggers a **CORS preflight (OPTIONS) request**, which your strict CORS policy (implemented in Topic #6) will instantly block.

Your API is now 100% immune to browser-based CSRF attacks.
