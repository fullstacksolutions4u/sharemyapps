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
const { pushTimeseries } = require('prometheus-remote-write');

const PUSH_INTERVAL_MS = 15 * 1000; // Push every 15 seconds

/**
 * Pushes all current prom-client metrics to Grafana Cloud
 * using the Prometheus Pushgateway-compatible HTTP API.
 */
async function pushMetrics() {
  const url      = process.env.GRAFANA_REMOTE_WRITE_URL;
  const username = process.env.GRAFANA_USERNAME;
  const token    = process.env.GRAFANA_TOKEN;

  if (!url || !username || !token) return;

  try {
    const metrics = await register.getMetricsAsJSON();
    const timeseriesArr = [];
    const now = Date.now();

    for (const metric of metrics) {
      for (const val of metric.values) {
        const labels = {
          __name__: val.metricName || metric.name,
          instance: 'sharemyapps-server',
        };
        if (val.labels) {
          for (const [k, v] of Object.entries(val.labels)) {
            labels[k] = String(v);
          }
        }
        timeseriesArr.push({
          labels,
          samples: [{ value: val.value, timestamp: now }]
        });
      }
    }

    const response = await pushTimeseries(timeseriesArr, {
      url,
      auth: { username, password: token }
    });

    if (response.status !== 200 && response.status !== 204) {
      console.warn(`[metrics-pusher] Push failed (${response.status}): ${response.statusText}`);
    }
  } catch (err) {
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
  pushMetrics();
  setInterval(pushMetrics, PUSH_INTERVAL_MS);
}

module.exports = { startMetricsPusher };

