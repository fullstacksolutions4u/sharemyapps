# Load Balancing in Microservices

As your application grows and transitions from a single backend server (monolith) to multiple independent services (microservices), routing traffic efficiently becomes critical. This is the job of a **Load Balancer**.

A Load Balancer sits between the client (your React app) and your backend servers. It acts as a traffic cop, distributing incoming HTTP requests across a pool of servers to ensure no single server is overwhelmed.

---

## Why Use a Load Balancer?
1.  **High Availability:** If one microservice instance crashes, the load balancer stops sending traffic to it and redirects requests to healthy instances.
2.  **Scalability:** You can seamlessly add or remove servers (horizontal scaling) behind the load balancer without the client ever knowing.
3.  **Performance:** By distributing the load evenly, you ensure fast response times for users.

---

## Common Load Balancing Algorithms

Load balancers use specific algorithms to decide which backend server should receive the next incoming request. Here are the most common ones:

### 1. Round Robin
The simplest and most common algorithm. Requests are distributed sequentially across the pool of servers. 
*   **How it works:** Request 1 goes to Server A, Request 2 goes to Server B, Request 3 goes to Server C, Request 4 goes back to Server A.
*   **Best for:** Environments where all servers have identical hardware specifications and the requests take roughly the same amount of time to process.

### 2. Weighted Round Robin
An upgrade to Round Robin that accounts for servers with different capabilities.
*   **How it works:** You assign a "weight" to each server. For example, if Server A is twice as powerful as Server B, you give Server A a weight of 2 and Server B a weight of 1. The load balancer will send two requests to Server A for every one request sent to Server B.
*   **Best for:** Hybrid environments where you have a mix of old and new servers with varying CPU and RAM capacity.

### 3. Least Connections
Traffic is routed based on the current workload of the servers rather than a strict sequence.
*   **How it works:** The load balancer monitors how many active connections each server currently has. The next incoming request is sent to the server with the **fewest active connections**.
*   **Best for:** Applications where requests take a highly variable amount of time to process (e.g., one request is a quick database read, while another involves a heavy AI image generation task).

### 4. IP Hash (Sticky Sessions)
This algorithm ensures that a specific user is consistently routed to the exact same server.
*   **How it works:** The load balancer takes the client's IP address and runs a mathematical hash function on it. The result dictates which server the request goes to. Because the IP stays the same, the user always hits the same server.
*   **Best for:** Legacy applications that store session data in the server's local memory (RAM) rather than in a shared database like Redis. *(Note: Modern stateless architectures generally avoid this).*

### 5. Random
Exactly what it sounds like.
*   **How it works:** The load balancer picks a random server from the pool of healthy servers.
*   **Best for:** Large clusters with hundreds of identical servers where the statistical probability will naturally result in an even distribution of load.

### 6. Hybrid Approaches
In modern, complex architectures, algorithms are often combined to create a **Hybrid Approach** for optimal routing.
*   **Weighted Least Connections:** This combines "Least Connections" with "Weighted Round Robin." The load balancer sends the request to the server with the lowest number of active connections *relative* to its assigned capacity weight. This prevents a weak server from getting the same number of connections as a powerful server.
*   **Global to Local Hybrid:** A massive application might use a **Layer 4 Load Balancer** at the global level (routing users to the nearest data center using IP Geolocation), and then a **Layer 7 Load Balancer** inside that data center using **Least Connections** to route to specific microservices.
*   **Fallback Chaining:** An algorithm like **IP Hash** might be the primary method to ensure a user stays on the same server, but if that server goes down, the load balancer *falls back* to **Round Robin** to select a new server for them.

---

## Layer 4 vs. Layer 7 Load Balancing

*   **Layer 4 (Transport Layer):** Balances traffic based purely on network information like IP addresses and TCP ports. It is incredibly fast but "blind" to the actual content of the HTTP request.
*   **Layer 7 (Application Layer):** Balances traffic based on the actual content of the HTTP message (URLs, headers, cookies). 
    *   *Example:* If a user requests `/api/payments`, a Layer 7 load balancer reads that URL and specifically routes the request to the Payment Microservice cluster.

## Application in ShareMyApps
Currently, your backend is hosted on **GCP Cloud Run**. Cloud Run provides an invisible, fully-managed **Layer 7 Load Balancer** out of the box. As traffic spikes, Cloud Run automatically spins up new Docker container instances and handles the round-robin routing between them instantly.
