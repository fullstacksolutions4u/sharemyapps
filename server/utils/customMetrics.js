const promClient = require('prom-client');

// Histogram to track how long it takes for a user to complete onboarding
const onboardingDuration = new promClient.Histogram({
  name: 'sharemyapps_onboarding_duration_seconds',
  help: 'Time taken in seconds for a user to complete their profile setup',
  labelNames: ['userType'],
  // Define the buckets (in seconds). E.g., 30s, 1m, 5m, 10m, 30m, 1hr
  buckets: [30, 60, 300, 600, 1800, 3600]
});

// Counter to track total user signups and logins
const userActivityCounter = new promClient.Counter({
  name: 'sharemyapps_user_activity_total',
  help: 'Total number of user logins and signups',
  labelNames: ['action'] // action can be 'signup' or 'login'
});

// Gauge to track the number of registered users in the last hour
const hourlyRegisteredUsers = new promClient.Gauge({
  name: 'sharemyapps_hourly_registered_users',
  help: 'Number of users registered in the last hour'
});

module.exports = {
  onboardingDuration,
  userActivityCounter,
  hourlyRegisteredUsers
};
