/**
 * Metrics Pusher for Grafana Cloud
 * 
 * Since the server runs on Google Cloud Run (serverless), there is no
 * persistent machine to install a Grafana Alloy agent. Instead, this
 * module pushes metrics directly from the Node.js app to Grafana Cloud's
 * Prometheus endpoint every 15 seconds.
 * 
 * Required Environment Variables:
 *   GRAFANA_REMOTE_WRITE_URL  - e.g. https://prometheus-prod-43-prod-ap-south-1.grafana.net/api/prom/push
 *   GRAFANA_USERNAME          - Your Grafana Cloud metrics username (numeric ID)
 *   GRAFANA_TOKEN             - Your Grafana Cloud API token
 */

const { register } = require('prom-client');

const PUSH_INTERVAL_MS = 15 * 1000; // Push every 15 seconds

/**
 * Pushes all current prom-client metrics to Grafana Cloud
 * using the Prometheus Pushgateway-compatible HTTP API.
 */
async function pushMetrics() {
  const url      = process.env.GRAFANA_REMOTE_WRITE_URL;
  const username = process.env.GRAFANA_USERNAME;
  const token    = process.env.GRAFANA_TOKEN;

  // Silently skip if credentials are not configured
  if (!url || !username || !token) return;

  try {
    const metricsText  = await register.metrics();
    const contentType  = register.contentType;
    const credentials  = Buffer.from(`${username}:${token}`).toString('base64');

    // Grafana Cloud Prometheus accepts text-format metrics via the
    // Pushgateway-compatible endpoint with Basic Auth
    const pushUrl = `${url}/job/sharemyapps`;

    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Basic ${credentials}`,
      },
      body: metricsText,
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[metrics-pusher] Push failed (${response.status}): ${body}`);
    }
  } catch (err) {
    // Never throw — a failed push should never crash the server
    console.warn('[metrics-pusher] Error pushing metrics:', err.message);
  }
}

/**
 * Starts the metrics push loop.
 * Call this once after the server starts.
 */
function startMetricsPusher() {
  const url = process.env.GRAFANA_REMOTE_WRITE_URL;
  if (!url) {
    console.log('[metrics-pusher] GRAFANA_REMOTE_WRITE_URL not set — metrics push disabled.');
    return;
  }

  console.log('[metrics-pusher] Starting Grafana Cloud metrics pusher (every 15s)...');
  
  // Push immediately on start, then on interval
  pushMetrics();
  setInterval(pushMetrics, PUSH_INTERVAL_MS);
}

module.exports = { startMetricsPusher };
