/** Job Post Links week boundary: Monday 06:00 Asia/Kolkata (IST). */

const WEEK_TZ = 'Asia/Kolkata';
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getZonedParts(date, timeZone = WEEK_TZ) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
function zonedTimeToUtc({ year, month, day, hour, minute = 0, second = 0 }, timeZone = WEEK_TZ) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const asZoned = getZonedParts(utcGuess, timeZone);
  const asUtcMs = Date.UTC(
    asZoned.year,
    asZoned.month - 1,
    asZoned.day,
    asZoned.hour,
    asZoned.minute,
    asZoned.second
  );
  const wantedMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(utcGuess.getTime() + (wantedMs - asUtcMs));
}

/**
 * Start of the current Job Post Links week: most recent Monday 06:00 IST
 * (if now is Monday before 06:00, returns the previous Monday 06:00).
 */
function getCurrentWeekStartMonday6AM(now = new Date()) {
  const parts = getZonedParts(now, WEEK_TZ);
  const dow = WEEKDAY_INDEX[parts.weekday] ?? 0;
  const daysSinceMonday = (dow + 6) % 7; // Mon=0 … Sun=6

  let weekStart = zonedTimeToUtc(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 6,
      minute: 0,
      second: 0,
    },
    WEEK_TZ
  );

  weekStart = new Date(weekStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);

  if (now < weekStart) {
    weekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return weekStart;
}

module.exports = {
  WEEK_TZ,
  getCurrentWeekStartMonday6AM,
};
