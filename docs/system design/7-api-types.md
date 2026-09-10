# Types of APIs in ShareMyApps

To give you the most accurate overview, it helps to look at APIs from two different angles: **Architectural Styles** (how your backend communicates) and **Third-Party Services** (external tools you integrate). 

Since **ShareMyApps** is built on the MERN stack (MongoDB, Express, React, Node.js), here are the types of APIs you can use in your app:

## 1. API Architectural Styles (How you build your API)
These dictate how your React frontend talks to your Express backend:

*   **RESTful APIs (Currently Used):** Your app currently uses REST (Representational State Transfer). It's the standard way to build web APIs using standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). It is stateless and highly scalable.
*   **WebSockets (Real-time):** If you want to add real-time features to ShareMyApps (like live chat, instant notifications, or live collaboration), you would use WebSockets (e.g., using `Socket.io`). Unlike REST, WebSockets keep a connection constantly open.
*   **GraphQL:** An alternative to REST where the frontend specifies exactly what data it wants. It prevents over-fetching data. You could implement this using Apollo Server on your backend, though REST is perfectly fine for your current scale.
*   **gRPC:** Used mostly for microservices communicating with each other backend-to-backend. (Not needed unless you break your backend into multiple separate Node.js services).

## 2. Third-Party Integration APIs (Services you can plug in)
Based on your current architecture, you are already using several external API types, and can easily add more:

*   **Authentication APIs:** 
    *   *Currently using:* Google OAuth (`passport-google-oauth20`) for social login.
    *   *Can add:* GitHub OAuth, LinkedIn Login (great for a developer platform).
*   **Payment Gateway APIs:** 
    *   *Currently using:* Razorpay for handling transactions and subscriptions.
    *   *Can add:* Stripe, PayPal.
*   **Artificial Intelligence (AI) APIs:**
    *   *Currently using:* OpenAI and Anthropic (`@anthropic-ai/sdk`) for features like JD analysis or resume parsing.
*   **Storage & CDN APIs:**
    *   *Currently using:* Cloudinary (for image/avatar uploads) and GCP Storage (`@google-cloud/storage`).
*   **Email & Communication APIs:**
    *   *Currently using:* Resend and Brevo (`@getbrevo/brevo`) for transactional emails (OTPs, notifications).
    *   *Can add:* Twilio (for SMS notifications).

## 3. Browser APIs (Frontend Native)
Your React app can also interact with the user's browser using built-in Web APIs:
*   **Geolocation API:** To find a developer's location.
*   **Web Storage API:** `localStorage` and `sessionStorage` (which you use to store your JWT token).
*   **Clipboard API:** For "Copy Profile Link" features.
*   **Service Workers / Web Push API:** If you want to add offline support or push notifications to the browser.
