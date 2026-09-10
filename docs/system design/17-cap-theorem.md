# The CAP Theorem

When you scale a database beyond a single server (by adding replicas or sharding), you enter the realm of Distributed Systems. 

The **CAP Theorem** is the most famous principle in computer science regarding distributed databases. It states that a distributed data store can only guarantee **two out of the following three** characteristics simultaneously:

---

### 1. Consistency (C)
Every read receives the most recent write, or an error. 
*   If you update your profile name to "John Doe", and a millisecond later your friend queries your profile, they must see "John Doe". They will never see the old data. The system waits until all database replicas are perfectly synced before returning a result.

### 2. Availability (A)
Every request receives a (non-error) response, without the guarantee that it contains the most recent write.
*   If you ask the database for your profile, it will *always* give you a response instantly. Even if some database servers are broken, the healthy ones will just give you whatever data they have, even if it is slightly outdated (stale).

### 3. Partition Tolerance (P)
The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network between nodes.
*   If the network cable connecting Database Server A and Database Server B is cut (a partition), the system must still function.

---

## The Reality of CAP

In modern distributed systems, **Network Partitions (P) are unavoidable**. Cables get cut, routers crash, and packets get lost. Because you *must* tolerate partitions, you are forced to choose between Consistency and Availability during a network failure.

### Option 1: CP (Consistency + Partition Tolerance)
If Server A and Server B lose connection, a **CP** system will shut down Server B and refuse to answer read/write requests. 
*   *Why?* Because it cannot guarantee that Server B has the most up-to-date information. It sacrifices Availability to ensure nobody ever reads stale data.
*   *Used for:* Banking systems, financial transactions. (It is better to say "Service Unavailable" than to tell someone they have $1,000 when they actually have $0).
*   *Databases:* MongoDB (by default), HBase.

### Option 2: AP (Availability + Partition Tolerance)
If Server A and Server B lose connection, an **AP** system will keep both servers running. If you ask Server B for data, it will give you its best guess based on the last time it talked to Server A.
*   *Why?* Because it prioritizes keeping the app online over having perfectly accurate data. This is known as **Eventual Consistency** (the data will eventually sync up when the network is fixed).
*   *Used for:* Social media feeds, likes, comments. (If a user sees 100 likes instead of 101 likes for a few minutes, it doesn't matter, as long as the app doesn't crash).
*   *Databases:* Cassandra, DynamoDB.

### (Why not CA?)
A CA system (Consistency + Availability) means the system cannot tolerate network failures. This only exists if your entire database lives on one single physical machine without any network involved. The moment you add a second server, you must account for 'P'.
