# Monitoring, Observability, and Alerting

When building a production-grade application like **ShareMyApps**, deploying the code is only half the battle. You need to know what happens when things go wrong in production.

This is handled by a robust **Monitoring, Observability, and Alerting** stack.

---

## 1. Monitoring vs. Observability
While people often use these terms interchangeably, they mean different things:

*   **Monitoring** tells you **that** a system is broken. (e.g., "The CPU is at 100%" or "The server is returning 500 errors"). It relies on predefined dashboards and known failure states.
*   **Observability** lets you figure out **why** the system is broken. (e.g., "The CPU spiked because User X uploaded a massive, corrupted PDF that caused the AI parser to get stuck in an infinite loop"). It allows you to debug unknown, novel issues in production.

---

## 2. The Three Pillars of Observability
To achieve true observability, you need to collect three types of data from your application:

### A. Metrics
Metrics are numerical representations of data measured over intervals of time. They are cheap to store and easy to graph.
*   *Examples:* CPU usage (%), Memory usage (MB), Requests per second (RPS), Average Database Query time (ms), Error rate (%).
*   *Use Case:* "Is my Express server running out of RAM right now?"

### B. Logs
Logs are immutable, timestamped records of discrete events that happened over time. 
*   *Examples:* Unhandled exceptions, user login events, payment processing failures.
*   *Use Case:* A user complains their payment failed. You search the logs for their `userId` and find an error: `Stripe API: Card Declined - Insufficient Funds`.

### C. Traces (Distributed Tracing)
A trace records the entire journey of a single user request as it travels through your entire architecture (Frontend -> API Gateway -> Auth Service -> Database).
*   *Use Case:* A user clicks "Analyze JD" and it takes 30 seconds. A trace will show you exactly where the time was spent: 0.5s in the Express Router, 1s in MongoDB, 28s waiting for the OpenAI API, and 0.5s sending the response back.

---

## 3. Alerting
Collecting all this data is useless if nobody looks at it. **Alerting** is the process of notifying developers when metrics or logs indicate a problem.

*   **Threshold Alerts:** Triggered when a metric crosses a limit. (e.g., "Send an alert if CPU > 90% for 5 minutes").
*   **Anomaly Detection:** AI-driven alerts that trigger when traffic patterns look weird. (e.g., "We usually get 500 signups an hour, but we got 0 in the last hour. Something might be broken.").
*   **Alert Fatigue:** A common anti-pattern where a system sends too many useless alerts. Developers eventually ignore them ("The boy who cried wolf"), leading to a real outage being missed. **Rule of thumb: Only alert if a human needs to take immediate action.**

---

## 4. Popular Tools & Technologies

### The ELK Stack (For Logging)
*   **Elasticsearch** (Search engine for logs)
*   **Logstash** (Ingests and parses logs from your Node.js app)
*   **Kibana** (UI to search and visualize the logs)

### Prometheus & Grafana (For Metrics)
*   **Prometheus:** A time-series database that "scrapes" your servers every 10 seconds to collect metrics.
*   **Grafana:** A beautiful dashboarding tool that hooks into Prometheus to draw charts and graphs.

### APM (Application Performance Monitoring)
Tools that provide Logs, Metrics, and Traces all in one single, paid platform:
*   **Datadog:** The industry standard for massive companies. Extremely powerful, very expensive.
*   **New Relic:** Similar to Datadog, great for deep application tracing.
*   **Sentry:** Highly recommended for ShareMyApps. It catches unhandled exceptions in React and Node.js, captures the stack trace, and alerts your Slack channel immediately.

---

## 5. Application in ShareMyApps
For your current MERN stack on GCP/Firebase:
1.  **Sentry:** Add the Sentry SDK to your React frontend and Express backend. It takes 5 minutes and will instantly alert you if a user experiences a crash.
2.  **GCP Cloud Logging / Firebase Crashlytics:** Since you are on GCP Cloud Run, all your `console.log()` and `console.error()` outputs are automatically ingested into GCP Logs Explorer.
3.  **Uptime Monitoring:** Use a free tool like **UptimeRobot** to ping your `api/health` endpoint every 5 minutes. If it fails, it sends you an email.
