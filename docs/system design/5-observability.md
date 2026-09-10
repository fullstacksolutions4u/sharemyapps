# Chapter 5: Observability in Production

When deploying a system to production, especially in a distributed environment like GCP Cloud Run, you need to understand exactly what the application is doing at any given time. This concept is called **Observability**.

Observability allows you to diagnose issues, understand performance bottlenecks, and monitor user behavior without having to guess or manually reproduce bugs. It is built on three main pillars: **Logs, Metrics, and Traces**.

---

## 1. Logging
Logs are immutable, timestamped records of discrete events that happened over time. 
* **Application Logs:** In your Node.js server, every `console.log()` or `console.error()` (e.g., `console.error('Error creating job link:', error);`) is a log. 
* **Access Logs:** Records of every incoming HTTP request (IP address, requested URL, response time, HTTP status code).

### Best Practices for ShareMyApps:
* **Structured Logging:** Instead of standard text logs, use JSON-structured logs (via libraries like `Winston` or `Pino`). GCP Cloud Logging automatically parses JSON, allowing you to easily filter logs (e.g., "Show me all logs where `user_id = 123`").
* **Log Aggregation:** Since Cloud Run scales out to multiple containers, you cannot SSH into a single server to read a text file. All logs must be aggregated in GCP Cloud Logging so they can be searched in one place.

## 2. Metrics
Metrics are numerical representations of data measured over intervals of time. They are used to gauge the overall health of the system.
* **Infrastructure Metrics:** CPU usage, Memory consumption, Network I/O.
* **Application Metrics:** Request latency (how fast does the feed load?), Error rate (how many 500 status codes vs 200 status codes?), Request volume (how many users are active right now?).

### Best Practices for ShareMyApps:
* **GCP Cloud Monitoring:** Cloud Run provides these metrics out-of-the-box. You don't need to write custom code to see your CPU usage or 5xx error rates.
* **Dashboards:** Create a single dashboard in GCP that shows your top 4 golden signals: Latency, Traffic, Errors, and Saturation (CPU/Memory limits).

## 3. Distributed Tracing
Tracing tracks the progression of a single user request as it is handled by various services in your architecture. 
* **Example:** A user clicks "Extract Job Details". A trace will show exactly how many milliseconds were spent parsing the request, how many milliseconds were spent waiting for the OpenAI API, how many milliseconds were spent querying MongoDB for duplicates, and how long it took to return the response.

### Best Practices for ShareMyApps:
* **GCP Cloud Trace / OpenTelemetry:** Implementing distributed tracing helps pinpoint exactly *where* a bottleneck is occurring. If the job extraction is slow, a trace will tell you if OpenAI is lagging, or if your MongoDB query is inefficient.

## 4. Alerting
Observability is useless if you have to manually stare at dashboards all day. Alerting is the process of setting thresholds on your metrics or logs and proactively notifying the team when they are breached.

### Best Practices for ShareMyApps:
* **Error Rate Alerts:** Send a notification to a Slack/Discord channel or an email if the HTTP 5xx error rate exceeds 1% over a 5-minute window.
* **Cost Alerts:** Set up GCP Billing alerts (which you seem to have in place) to notify you if daily spend spikes, which could indicate a DDoS attack or an infinite loop bug.
