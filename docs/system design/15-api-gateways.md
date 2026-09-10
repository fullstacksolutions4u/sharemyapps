# API Gateways

As your application evolves from a monolith into microservices, you face a new problem: If you have 5 different microservices (Users, Payments, Projects, AI, Notifications), how does the React frontend know which IP address or URL to talk to for each specific action?

An **API Gateway** solves this by acting as the single, unified entry point for all client requests.

---

## What is an API Gateway?
Instead of the frontend making requests directly to the individual backend services, it sends *all* requests to one place: `api.sharemyapps.com`. 

The API Gateway receives the request, looks at the URL path (e.g., `/payments`), and seamlessly routes the request to the hidden internal Payment Microservice.

---

## Core Responsibilities

An API Gateway does much more than just routing. It offloads repetitive tasks from your microservices so they can focus on business logic.

### 1. Request Routing (Reverse Proxy)
It maps public URLs to internal service IPs. If a service moves to a new server, you only update the API Gateway; the frontend code never changes.

### 2. Authentication & Authorization
Instead of forcing every single microservice to verify JWT tokens and check user roles, the API Gateway does it once at the front door. If the token is invalid, the request is rejected before it ever reaches your internal network.

### 3. Rate Limiting & Throttling
The Gateway tracks IP addresses and enforces rate limits (e.g., 100 requests/minute). This protects your fragile internal microservices from DDoS attacks.

### 4. SSL Termination
Decrypting HTTPS traffic is CPU-intensive. The API Gateway handles the SSL certificates, decrypts the incoming HTTPS traffic, and then forwards the request internally over fast, unencrypted HTTP (since your internal network is secure).

### 5. API Composition (Aggregation)
If the frontend needs a User Profile, their latest 5 Projects, and their Payment Status to render a dashboard, it used to require 3 separate HTTP requests. An API Gateway can receive 1 request from the client, make the 3 internal requests simultaneously, combine the JSON responses, and return 1 neat package to the frontend.

---

## Popular API Gateway Technologies

*   **Kong:** A highly scalable, open-source gateway built on NGINX.
*   **Amazon API Gateway:** A fully managed AWS service, deeply integrated with AWS Lambda.
*   **Apigee:** Google Cloud's enterprise-grade API management platform.
*   **NGINX / HAProxy:** Traditional reverse proxies that can be configured to act as lightweight API gateways.
*   **Express.js (Custom):** You can build a simple API Gateway yourself using Node.js and a package like `http-proxy-middleware`, though dedicated tools are usually faster and safer.
