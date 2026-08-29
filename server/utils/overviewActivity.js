const Vacancy = require('../models/Vacancy');

const CHART_TZ = 'Asia/Kolkata';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateKeyInTz(date, timeZone = CHART_TZ) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function buildDailyBuckets() {
  const today = new Date();
  const currentDay = today.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const buckets = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + distanceToMonday + i);
    buckets.push({
      label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      dateKey: dateKeyInTz(d),
    });
  }
  return buckets;
}

function buildMonthlyBuckets() {
  const today = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    buckets.push({
      label: MONTH_NAMES[d.getMonth()],
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return buckets;
}

async function buildOverviewActivity(userId, userObjectId, isJobAlertEligible) {
  const JobLink = require('../models/JobLink');
  const JobAlertModel = require('../models/JobAlert');
  const uid = userId.toString();

  const dailyBuckets = buildDailyBuckets();
  const monthlyBuckets = buildMonthlyBuckets();
  const dailyMap = Object.fromEntries(
    dailyBuckets.map((b) => [b.dateKey, { label: b.label, apps: 0, clicks: 0, alerts: 0 }])
  );
  const monthlyMap = Object.fromEntries(
    monthlyBuckets.map((b) => [b.monthKey, { label: b.label, apps: 0, clicks: 0, alerts: 0 }])
  );

  const addDaily = (dateKey, field, n = 1) => {
    if (dailyMap[dateKey]) dailyMap[dateKey][field] += n;
  };
  const addMonthly = (monthKey, field, n = 1) => {
    if (monthlyMap[monthKey]) monthlyMap[monthKey][field] += n;
  };

  const vacancies = await Vacancy.find({ everApplied: userId })
    .select('applicantStatusHistory')
    .lean();
  for (const v of vacancies) {
    const hist = v.applicantStatusHistory?.[uid];
    const applied = hist?.find((e) => e.status === 'applied');
    if (!applied?.date) continue;
    const d = new Date(applied.date);
    addDaily(dateKeyInTz(d), 'apps');
    addMonthly(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 'apps');
  }

  const clickDays = await JobLink.aggregate([
    { $match: { 'clickEvents.user': userObjectId } },
    { $unwind: '$clickEvents' },
    { $match: { 'clickEvents.user': userObjectId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$clickEvents.at', timezone: CHART_TZ },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  for (const row of clickDays) {
    addDaily(row._id, 'clicks', row.count);
    const [y, m] = row._id.split('-');
    addMonthly(`${y}-${m}`, 'clicks', row.count);
  }

  if (isJobAlertEligible) {
    const alerts = await JobAlertModel.find({ notified: true, recipients: userObjectId })
      .select('jobs careerLinks scheduledAt createdAt')
      .lean();
    for (const a of alerts) {
      const count = (a.jobs?.length || 0) + (a.careerLinks?.length || 0);
      if (count === 0) continue;
      const d = new Date(a.scheduledAt || a.createdAt);
      addDaily(dateKeyInTz(d), 'alerts', count);
      addMonthly(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 'alerts', count);
    }
  }

  return {
    dailyActivity: dailyBuckets.map((b) => dailyMap[b.dateKey]),
    monthlyActivity: monthlyBuckets.map((b) => monthlyMap[b.monthKey]),
  };
}

module.exports = {
  buildOverviewActivity,
  dateKeyInTz,
};
