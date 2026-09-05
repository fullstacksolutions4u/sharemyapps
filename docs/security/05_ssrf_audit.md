# 🛡️ Server-Side Request Forgery (SSRF) Audit

> **Security Topic #5** | Audited: 2026-09-05 | Status: ✅ Safe

---

## 📖 What is SSRF?

**Server-Side Request Forgery (SSRF)** is a vulnerability where an attacker tricks a web application into making an HTTP request to an arbitrary domain or internal IP address. 

Attackers use this to:
- Access internal metadata services (e.g., AWS/GCP metadata at `169.254.169.254` to steal cloud credentials).
- Scan internal network ports.
- Access internal APIs that are usually protected by firewalls.

This typically happens when an app accepts a URL from the user (e.g., for a link preview, webhook, or image import) and directly fetches it using `axios`, `fetch`, or `http.get`.

---

## 🔎 Audit Results for ShareMyApps

I performed a comprehensive audit of your Express backend to check every location where your server makes outbound HTTP requests.

### What I checked:
- Usage of HTTP clients: native `fetch`, `axios`, `node-fetch`, `http.request`, `https.request`, etc.
- Dependencies in `package.json` capable of making requests.

### Findings

Your backend makes outbound HTTP requests in exactly **two places**:

1. **`server/routes/admin.js` (Lines 470, 973)**
   ```js
   const SHEET_ID = '10_CRMyhBMV_Ntmb-siPkBvgJRKRhNi3UyNgeycCsWQY';
   const GID = '676388485';
   const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
   const response = await fetch(url);
   ```
   ✅ **SAFE**: The URL, host, and path are completely hardcoded. Users cannot manipulate where this request goes.

2. **`server/utils/thumbnailGenerator.js` (Line 17)**
   ```js
   const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(liveUrl)}&screenshot=true&embed=screenshot.url`;
   const response = await fetch(screenshotUrl);
   ```
   ✅ **SAFE**: The base URL `https://api.microlink.io/` is hardcoded. Even if a user provides a malicious `liveUrl` (like an internal IP), **your server** only ever makes a request to `microlink.io`. It is the Microlink external service that actually fetches the target URL. If there is an SSRF vulnerability, it would affect Microlink's servers, not your GCP infrastructure.

---

## 🛡️ Conclusion

Your application is **not vulnerable to SSRF**. 

You do not take URLs from users and fetch them directly on the backend. By offloading URL screenshots to an external service (`microlink.io`), you successfully mitigated the primary risk vector for SSRF in this type of application.

### Best Practices to Maintain Safety
If you ever add a feature in the future that fetches user-provided URLs directly from your Express server (e.g., custom webhooks or native link previews):
- Use a dedicated library like `ssrf-req-filter` to block requests to private IP ranges (`127.0.0.0/8`, `169.254.169.254`, `10.0.0.0/8`, etc.).
- Never follow redirects blindly.
- Validate that the scheme is explicitly `http` or `https` (preventing `file://` or `gopher://` access).
