# Data Replication & Disaster Recovery (DR)

When building a globally available application, you must ensure that your data is safe, accessible from anywhere with low latency, and capable of surviving regional outages (like a fire in a data center). 

This is achieved through **Replication**, **Geo-Distribution**, and **Disaster Recovery (DR)** strategies.

---

## 1. Database Replication (High Availability)
Replication involves keeping multiple copies of your database on different servers. 

*   **Primary-Secondary Architecture:** As discussed in database scalability, MongoDB uses Replica Sets. One server is the "Primary" (handles writes), and others are "Secondaries" (copy data from the Primary).
*   **Synchronous vs. Asynchronous Replication:**
    *   *Synchronous:* The Primary waits for the Secondaries to confirm they have copied the data before telling the user "Success." It's highly secure but slower.
    *   *Asynchronous (Default for MongoDB):* The Primary writes the data, tells the user "Success," and then copies the data to Secondaries in the background. It's much faster, but there's a tiny risk of data loss if the Primary dies before the copy finishes.
*   **Auto-Failover:** If the Primary server goes offline, the Secondaries hold an "election" within seconds to promote a new Primary, ensuring zero downtime.

---

## 2. Geo-Replication (Global Availability)
If your app is hosted only in New York, users in India will experience high latency (lag) because data has to travel halfway across the world. **Geo-Replication** solves this.

*   **How it works:** You place database replicas in different geographic regions around the world.
    *   *Example:* Primary in US-East, Secondary 1 in EU-West (London), Secondary 2 in AP-South (Mumbai).
*   **Benefits:**
    1.  **Low Latency Reads:** A user in India reads data from the Mumbai replica instead of the New York primary, making the app feel instantly responsive.
    2.  **Regional Resilience:** If an entire cloud region goes offline (e.g., the US-East data center loses power), your app automatically fails over to the European region.

---

## 3. Backups & Disaster Recovery (DR)
Replication protects against server crashes, but it **does not protect against human error**. If a developer accidentally runs `db.users.drop()`, that deletion is instantly replicated to all servers. You need **Backups** to restore lost data.

### Key Metrics: RPO and RTO
When designing a backup strategy, architects focus on two metrics:
1.  **RPO (Recovery Point Objective):** How much data are you willing to lose? (e.g., An RPO of 1 hour means you might lose up to 1 hour of recent user data if you have to restore).
2.  **RTO (Recovery Time Objective):** How quickly must the system be back online after a disaster? (e.g., An RTO of 4 hours means the app can be down for no more than 4 hours).

### Backup Strategies
*   **Snapshot Backups:** Taking a complete picture of the database at specific intervals (e.g., every night at 2 AM). Great for historical archives, but has a high RPO (you lose a whole day of data if a crash happens at 1:59 AM).
*   **Continuous Backups (Point-in-Time Recovery):** The database continuously records every single write operation (the `oplog` in MongoDB) to a secure cloud storage bucket (like AWS S3). If disaster strikes, you can restore the database to the exact minute before the accident happened.

### Disaster Recovery Plans
A DR plan outlines what happens if an entire geographical region is destroyed.
*   **Active-Passive:** You have a fully running system in New York, and a dormant backup system in London. If NY dies, you flip a DNS switch to route traffic to London. It's cheaper, but takes time to switch.
*   **Active-Active:** Both New York and London systems are live and taking traffic simultaneously. If one dies, the other just takes on the extra load. It's very expensive and complex to keep data synced, but offers an RTO of near zero.

---

## 4. Database Partitioning (Sharding)
While Replication copies the *same* data to multiple servers, **Partitioning** (also known as Sharding) splits your massive database into smaller, more manageable pieces stored across different servers.

### Types of Partitioning
1.  **Horizontal Partitioning (Sharding):** 
    *   *What it is:* Splitting the database by rows. 
    *   *Example:* A `Users` collection with 10 million users is split so that Server A holds users 1 to 5,000,000 and Server B holds users 5,000,001 to 10,000,000. Both servers have the exact same schema/columns.
2.  **Vertical Partitioning:** 
    *   *What it is:* Splitting the database by columns (features).
    *   *Example:* Moving the `User Profiles` (name, avatar, bio) to Server A, and `User Payment History` (credit cards, invoices) to a highly secure Server B. 

### Partitioning Criteria (How to split the data)
To partition horizontally, you must choose a "Partition Key" (or Shard Key in MongoDB) to decide where data goes:
*   **Range-Based Partitioning:** Data is assigned based on a range of values. (e.g., Users created in 2024 go to Server A, 2025 to Server B). *Risk:* Can create "hotspots" where the newest server does all the work while the 2024 server sits idle.
*   **Hash-Based Partitioning:** A mathematical hash function runs on the Partition Key (like User ID), resulting in a number that maps to a specific server. *Benefit:* Distributes data perfectly evenly across all servers, preventing hotspots.
*   **Directory-Based Partitioning:** A dedicated lookup service (a "directory") keeps a master map of exactly which server holds which piece of data. The application queries the directory first, then goes to the correct server.
