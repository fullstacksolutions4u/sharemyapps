# Real-Time Communication

Traditional web applications operate on a simple Request-Response cycle: The client (browser) asks for data, and the server responds. The server cannot initiate contact with the client.

If you are building features like Live Chat, Live Notifications, or Collaborative Editing (like Google Docs), the server needs a way to instantly push data to the client the moment an event happens.

Here are the three primary system design patterns for achieving this:

---

## 1. Long Polling
The legacy workaround before modern protocols existed.

*   **How it works:** The client asks the server, "Do you have any new messages?" The server *holds the connection open* and doesn't reply until it actually has a new message. Once the server replies, the connection closes, and the client immediately opens a new connection to ask again.
*   **Pros:** Works on ancient browsers and restrictive corporate firewalls.
*   **Cons:** Very resource-intensive. Holding thousands of empty HTTP connections open drains server memory.

## 2. Server-Sent Events (SSE)
A modern, lightweight standard for **one-way** communication from the Server to the Client.

*   **How it works:** The client makes a standard HTTP request to the server. The server responds with `Content-Type: text/event-stream` and keeps the connection open indefinitely. The server can now push a continuous stream of text data down that pipe whenever it wants.
*   **Pros:** 
    *   Uses standard HTTP (no special firewall rules needed).
    *   Built-in automatic reconnection if the network drops.
    *   Very low server overhead.
*   **Cons:** It is strictly One-Way (Server -> Client). The client cannot send messages back up this pipe; it has to make standard POST requests to send data.
*   **Best for:** Live stock tickers, Twitter feeds, Live sports scores, Push Notifications.

## 3. WebSockets
The industry standard for true **two-way (bidirectional)** real-time communication.

*   **How it works:** The client sends an HTTP "upgrade" request. If the server accepts, the HTTP protocol is stripped away, leaving a raw, persistent TCP connection. Both the client and the server can instantly push messages to each other at any time.
*   **Pros:** 
    *   Extremely low latency (milliseconds).
    *   Minimal overhead (no bulky HTTP headers attached to every message).
    *   True full-duplex communication.
*   **Cons:** 
    *   Requires a specialized backend setup (e.g., `Socket.io` in Node.js).
    *   Stateful: Since connections remain open, Load Balancing becomes difficult. If a user connects to Server A, all subsequent messages for that user must be routed to Server A, or the servers must share a Redis Pub/Sub backplane to broadcast messages to each other.
*   **Best for:** Multiplayer gaming, Live Chat apps (WhatsApp, Discord), Collaborative whiteboards.

---

### Application in ShareMyApps
If you want to add instant notifications when a user receives a message from a recruiter:
*   If it's just notifications: Use **Server-Sent Events (SSE)**. It's much easier to implement and scale in Node.js than WebSockets.
*   If you are building a full, live chat interface where typing indicators ("User is typing...") are required: Use **WebSockets** (specifically the `Socket.io` library for React/Node).
