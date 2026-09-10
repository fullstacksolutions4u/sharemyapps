# Rate Limiting & Throttling

When you expose an API to the internet, it is vulnerable to abuse. Malicious actors might try to brute-force passwords, scrape your entire database, or launch a Distributed Denial of Service (DDoS) attack to take your servers offline.

**Rate Limiting** is the primary defense mechanism to prevent this by controlling the rate of traffic sent or received by a network interface.

---

## Why Use Rate Limiting?
1.  **Prevent Resource Starvation (DDoS):** Stops a single IP address from consuming all your server's CPU or database connections.
2.  **Cost Control:** If you use paid third-party APIs (like OpenAI for JD analysis), rate limiting prevents a user from running up massive bills on your account.
3.  **Security:** Slows down brute-force attacks on login endpoints.

---

## Common Rate Limiting Algorithms

### 1. Token Bucket
Imagine a bucket that holds a maximum of 10 tokens. Every minute, the server drops 2 new tokens into the bucket. Every time a user makes a request, they take 1 token out. 
*   *If the bucket is empty,* the request is rejected (HTTP 429 Too Many Requests).
*   *Pros:* Allows for sudden bursts of traffic (up to the bucket's max capacity) while maintaining an average rate over time.

### 2. Leaky Bucket
Imagine a bucket with a hole at the bottom. Requests pour into the top of the bucket at any speed, but they "leak" out the bottom to be processed by the server at a steady, constant rate.
*   *If the bucket overflows,* new requests are discarded.
*   *Pros:* Extremely smooth and predictable load on your backend servers. No bursts allowed.

### 3. Fixed Window Counter
The timeline is divided into fixed windows (e.g., 1:00 to 1:01). Each window gets a counter. A user is allowed 100 requests per minute.
*   *If the user makes 100 requests at 1:00:59,* the window resets at 1:01:00, and they can immediately make 100 more requests.
*   *Pros:* Very easy to implement.
*   *Cons:* "Spike at the edges" problem (in the example above, the server receives 200 requests in 2 seconds).

### 4. Sliding Window Log
Instead of fixed windows, the system keeps a log of the exact timestamps of a user's recent requests. When a new request comes in, it deletes logs older than 1 minute, and checks if the remaining logs exceed the limit.
*   *Pros:* Extremely accurate. No edge spikes.
*   *Cons:* Consumes a lot of memory because you have to store thousands of timestamps.

### 5. Sliding Window Counter
A hybrid of Fixed Window and Sliding Window Log. It tracks the previous window's count and the current window's count, and calculates a weighted average based on the exact current time. 
*   *Pros:* Accurate, smooths traffic, and uses very little memory. (This is the industry standard).

---

## Application in ShareMyApps
In a Node/Express app, you typically implement rate limiting using middleware like `express-rate-limit`.

*   **General API Routes:** 300 requests per minute per IP.
*   **Login/Registration Routes:** 5 requests per 15 minutes per IP (Strict brute-force protection).
*   **AI / Heavy Processing Routes:** 10 requests per minute per IP (To protect your OpenAI API costs).

In a distributed environment (multiple Cloud Run instances), the rate limit counters should be stored in **Redis** rather than the local server memory, so that the limit applies globally regardless of which instance handles the request.
