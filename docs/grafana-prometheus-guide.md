# Grafana and Prometheus Monitoring Guide

Welcome to the world of application monitoring! This guide will teach you what Prometheus and Grafana are, how they work together, and how to use them to monitor your ShareMyApps Node.js server.

## 1. What are Prometheus and Grafana?

### Prometheus (The Collector)
Think of Prometheus as a highly efficient data vacuum. It is an open-source systems monitoring and alerting toolkit. 
- **How it works:** Instead of your application pushing data to a database, Prometheus regularly "scrapes" (pulls) metrics from a specific endpoint exposed by your app (in our case, `http://localhost:5000/metrics`).
- **What it stores:** It stores data as "time-series" (values recorded over time), which makes it extremely fast for querying historical performance data.

### Grafana (The Visualizer)
Raw data from Prometheus is just text and numbers, which is hard for humans to read. 
- **How it works:** Grafana connects to Prometheus as a "Data Source" and queries it.
- **What it does:** It turns those queries into beautiful, interactive dashboards (graphs, pie charts, gauges). You can see exactly how much CPU your app is using, how many requests are failing, and how fast your API is responding.

---

## 2. Our Implementation Setup

We have set up the following architecture:
1. **Node.js Express App:** We installed `prom-client` and `express-prom-bundle`. These inject a middleware into your app that automatically tracks incoming requests (count, duration, status codes) and exposes them at the `/metrics` endpoint.
2. **Prometheus Container:** Runs in Docker on port `9090`. It reads the `prometheus.yml` file, which tells it to scrape your Node.js app's `/metrics` endpoint every 5 seconds.
3. **Grafana Container:** Runs in Docker on port `3001` (since your React app uses 3000). It connects to the Prometheus container to visualize the data.

---

## 3. How to Start the Monitoring Stack

Since we are using Docker Compose, starting the monitoring stack is incredibly easy.

1. Open a new terminal at the root of your project `t:\Projects\Full Stack Solutions\sharemyapps`.
2. Run the following command:
   ```bash
   docker-compose up -d
   ```
   *(The `-d` flag runs it in detached mode so you can continue using your terminal)*
3. To stop the monitoring stack when you're done, run:
   ```bash
   docker-compose down
   ```

---

## 4. How to View Your Metrics

### Step 1: Verify Prometheus is Scrapping Data
1. Open your browser and go to: `http://localhost:9090` (Prometheus UI)
2. In the top nav, click **Status > Targets**.
3. You should see a target named `nodejs_app`. Its State should be **UP**. If it's UP, Prometheus is successfully pulling data from your running Node.js server!

### Step 2: Login to Grafana
1. Open your browser and go to: `http://localhost:3001`
2. **Login:** Use `admin` for the username and `admin` for the password. (It will ask you to set a new password, you can skip this for local development).

### Step 3: Connect Grafana to Prometheus
Grafana needs to know where to pull data from.
1. In Grafana, click the **Gear Icon (Configuration)** on the left sidebar, then click **Data Sources**.
2. Click **Add data source** and select **Prometheus**.
3. Under HTTP > URL, enter: `http://prometheus:9090` *(We use `prometheus` instead of `localhost` because inside the Docker network, they talk to each other using their container names).*
4. Scroll to the bottom and click **Save & test**. You should see a green success message.

### Step 4: Import a Dashboard
Instead of building a dashboard from scratch, the community has pre-built ones!
1. Hover over the **Plus Icon (+)** on the left sidebar and click **Import**.
2. In the "Import via grafana.com" field, enter the ID: `11159` (This is a popular dashboard for Node.js Express).
3. Click **Load**.
4. At the bottom, select your **Prometheus** data source from the dropdown.
5. Click **Import**.

**Congratulations!** You now have a live dashboard showing memory usage, event loop lag, request durations, and throughput for your ShareMyApps API! Try making a few requests on your frontend and watch the graphs spike in real-time.

---

## 5. Production Setup: Grafana Cloud + GCP Free Tier

Running Prometheus + Grafana inside Docker on a GCP `e2-micro` (1GB RAM) will crash your server. Instead, we use **Grafana Cloud's Free Forever tier**, which gives us:
- ✅ 10,000 metric series
- ✅ 14-day data retention
- ✅ No credit card required
- ✅ Only a tiny ~50MB agent runs on your GCP server

### Architecture (Production)
```
GCP Server (e2-micro)                   Grafana Cloud (their servers)
┌──────────────────────────┐            ┌────────────────────────────┐
│  Node.js App (:5000)     │            │  Prometheus (hosted)       │
│  └─ /metrics endpoint    │──push──▶   │  Grafana (hosted)          │
│                          │            │  Dashboards & Alerts       │
│  Grafana Alloy (~50MB)   │            └────────────────────────────┘
└──────────────────────────┘
```

### Step 1: Sign Up for Grafana Cloud
1. Go to [grafana.com](https://grafana.com) and click **"Create a free account"**.
2. Sign up with your Google account.
3. Choose a stack name (e.g., `sharemyapps`). This creates your personal Grafana Cloud instance.
4. After setup, you will land on your Grafana Cloud portal.

### Step 2: Get Your Cloud Connection Details
1. In Grafana Cloud, go to **My Account > Grafana Cloud Stack**.
2. Click on **"Send metrics"** under the Prometheus card.
3. You will see a page with:
   - **URL** (your Prometheus remote_write endpoint) — looks like `https://prometheus-prod-xx.grafana.net/api/prom/push`
   - **Username** (a number, e.g., `123456`)
   - **Password** (an API Token you generate) — click **"Generate now"** and copy it immediately.
4. **Save these 3 values.** You will need them in the next step.

### Step 3: Install Grafana Alloy on Your GCP Server
SSH into your GCP VM and run the following commands:

```bash
# Install Grafana Alloy (the lightweight agent)
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update
sudo apt-get install alloy -y
```

### Step 4: Configure Alloy to Scrape Your App and Push to Cloud
Create the configuration file:

```bash
sudo nano /etc/alloy/config.alloy
```

Paste the following (replace the placeholders with your values from Step 2):

```hcl
// Scrape metrics from your Node.js app
prometheus.scrape "nodejs" {
  targets = [{"__address__" = "localhost:5000"}]
  forward_to = [prometheus.remote_write.cloud.receiver]
  scrape_interval = "15s"
}

// Push metrics to Grafana Cloud
prometheus.remote_write "cloud" {
  endpoint {
    url = "YOUR_PROMETHEUS_REMOTE_WRITE_URL"

    basic_auth {
      username = "YOUR_USERNAME"
      password = "YOUR_API_TOKEN"
    }
  }
}
```

### Step 5: Start the Alloy Agent
```bash
# Start the agent and enable it to auto-start on server reboot
sudo systemctl start alloy
sudo systemctl enable alloy

# Check it is running correctly
sudo systemctl status alloy
```

You should see `active (running)` in green.

### Step 6: Import the Dashboard in Grafana Cloud
1. Log in to your Grafana Cloud Grafana URL (looks like `https://sharemyapps.grafana.net`).
2. Go to **Dashboards > Import**.
3. Enter dashboard ID **`11159`** and click **Load**.
4. Select your Grafana Cloud Prometheus data source.
5. Click **Import**.

**You are done!** Your GCP server is now monitored in the cloud, with zero impact on the server's RAM. You will see live production metrics from real users on your dashboard!

### Grafana Cloud Free Tier Limits
| Feature | Free Limit |
|---|---|
| Metrics series | 10,000 |
| Metrics retention | 14 days |
| Logs | 50GB/month |
| Alerting rules | 100 |
| Cost | **$0/month** |

> [!TIP]
> For a project like ShareMyApps, you will stay well within the free limits for a very long time. You only start approaching limits when you have thousands of daily active users.
