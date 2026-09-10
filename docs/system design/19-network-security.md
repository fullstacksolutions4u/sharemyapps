# Network Security & Infrastructure

When designing cloud architecture, writing secure code is not enough. You must physically and logically secure the network your servers run on. An attacker cannot hack an API if they cannot physically reach the IP address.

Here are the core concepts of infrastructure security:

---

## 1. VPC (Virtual Private Cloud)
A VPC is a logically isolated section of the cloud (AWS/GCP) where you can launch your resources. Think of it as a virtual fence around your application.
*   If you launch a database outside a VPC, it gets a public IP address. Anyone on the internet can try to guess the password.
*   If you launch a database *inside* a VPC, it only gets a private IP address (e.g., `10.0.0.5`). It is completely invisible to the outside world.

## 2. Subnets (Public vs. Private)
Inside your VPC, you divide the network into smaller segments called Subnets.
*   **Public Subnets:** Resources here have a route to the public internet. This is where you put your Load Balancers and API Gateways.
*   **Private Subnets:** Resources here have NO direct access to or from the internet. This is where you put your Express backend servers and MongoDB databases.
*   *How it works together:* A user on the internet hits the Load Balancer in the Public Subnet. The Load Balancer reaches across the internal network to the Express server in the Private Subnet. The Express server reaches the Database in the same Private Subnet.

## 3. WAF (Web Application Firewall)
A WAF sits in front of your Load Balancer and acts as an intelligent shield.
*   While a normal firewall just blocks IP addresses and ports, a WAF inspects the actual HTTP content of the request.
*   It automatically detects and blocks common hacking attempts like SQL Injection payloads, Cross-Site Scripting (XSS) scripts, and malicious bots before the request ever reaches your application.

## 4. IAM (Identity and Access Management)
IAM is how you control which internal services and developers are allowed to do what. The golden rule is the **Principle of Least Privilege** (giving a service exactly the permissions it needs, and nothing more).
*   *Example:* If your Express server needs to read images from a Cloud Storage bucket, you create an IAM Role that only has `storage.objects.get` permissions. You attach that role to the Express server. If the server gets hacked, the hacker cannot delete the bucket, because the IAM role doesn't have `storage.objects.delete` permissions.

## 5. DDoS Mitigation
Distributed Denial of Service (DDoS) attacks involve flooding your servers with millions of fake requests to crash them.
*   **Edge Protection:** Services like Cloudflare or AWS Shield sit at the very edge of the global network. They have massive bandwidth and can absorb and filter out malicious traffic spikes before they even reach your cloud provider.
*   **Auto-Scaling:** Properly configured cloud environments will automatically spin up more servers to absorb legitimate traffic spikes.

---

### Application in ShareMyApps
Since you are using **GCP Cloud Run** and **Firebase Hosting**, much of this is handled for you!
*   Cloud Run is a fully managed service that abstracts away VPCs by default, but you can configure a **Serverless VPC Access Connector** if you want your Cloud Run instances to talk securely to a private database without traversing the public internet.
*   GCP automatically provides DDoS protection and manages IAM roles for your deployed services via Service Accounts.
