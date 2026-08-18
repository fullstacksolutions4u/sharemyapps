const DISTRICTS_BY_STATE = require('../data/indiaDistricts');

const INDIA_STATES = Object.keys(DISTRICTS_BY_STATE);

const CITY_ALIASES = {
  bengaluru: 'Karnataka',
  bangalore: 'Karnataka',
  bombay: 'Maharashtra',
  mumbai: 'Maharashtra',
  chennai: 'Tamil Nadu',
  kochi: 'Kerala',
  cochin: 'Kerala',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  noida: 'Uttar Pradesh',
  'greater noida': 'Uttar Pradesh',
  thane: 'Maharashtra',
  pune: 'Maharashtra',
  nagpur: 'Maharashtra',
  hyderabad: 'Telangana',
  secunderabad: 'Telangana',
  ahmedabad: 'Gujarat',
  jaipur: 'Rajasthan',
  lucknow: 'Uttar Pradesh',
  kanpur: 'Uttar Pradesh',
  indore: 'Madhya Pradesh',
  bhopal: 'Madhya Pradesh',
  visakhapatnam: 'Andhra Pradesh',
  vizag: 'Andhra Pradesh',
  vijayawada: 'Andhra Pradesh',
  guwahati: 'Assam',
  patna: 'Bihar',
  ranchi: 'Jharkhand',
  bhubaneswar: 'Odisha',
  thiruvananthapuram: 'Kerala',
  trivandrum: 'Kerala',
  calicut: 'Kerala',
  mysore: 'Karnataka',
  mysuru: 'Karnataka',
  mangalore: 'Karnataka',
  mangaluru: 'Karnataka',
  hubli: 'Karnataka',
  coimbatore: 'Tamil Nadu',
  madurai: 'Tamil Nadu',
  trichy: 'Tamil Nadu',
  tiruchirappalli: 'Tamil Nadu',
  infopark: 'Kerala',
  technopark: 'Kerala',
  chakan: 'Maharashtra',
  hinjewadi: 'Maharashtra',
  magarpatta: 'Maharashtra',
  whitefield: 'Karnataka',
  'electronic city': 'Karnataka',
  sarjapur: 'Karnataka',
  marathahalli: 'Karnataka',
  omr: 'Tamil Nadu',
  'salt lake': 'West Bengal',
  kolkata: 'West Bengal',
  calcutta: 'West Bengal',
  dehradun: 'Uttarakhand',
  faridabad: 'Haryana',
  ghaziabad: 'Uttar Pradesh',
  mathura: 'Uttar Pradesh',
  varanasi: 'Uttar Pradesh',
  amritsar: 'Punjab',
  ludhiana: 'Punjab',
  jalandhar: 'Punjab',
  patiala: 'Punjab',
  bathinda: 'Punjab',
  rajkot: 'Gujarat',
  vadodara: 'Gujarat',
  surat: 'Gujarat',
  nashik: 'Maharashtra',
  aurangabad: 'Maharashtra',
  kolhapur: 'Maharashtra',
  solapur: 'Maharashtra',
  mohali: 'Punjab',
  ncr: 'Delhi',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
};

const NON_INDIA_MARKERS = [
  'usa', 'united states', 'u.s.', 'uk', 'united kingdom', 'london', 'canada',
  'australia', 'germany', 'singapore', 'dubai', 'uae', 'saudi', 'qatar',
  'bahrain', 'kuwait', 'oman', 'europe', 'china', 'japan', 'pakistan',
  'bangladesh', 'sri lanka', 'nepal', 'ireland', 'netherlands', 'france',
];

const CITY_TO_STATE = buildCityMap();

function normalizeKey(str) {
  return String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCityMap() {
  const map = new Map();

  for (const [state, districts] of Object.entries(DISTRICTS_BY_STATE)) {
    map.set(normalizeKey(state), state);
    for (const district of districts) {
      map.set(normalizeKey(district), state);
    }
  }

  for (const [alias, state] of Object.entries(CITY_ALIASES)) {
    map.set(normalizeKey(alias), state);
  }

  return map;
}

function isIndianState(name) {
  const key = normalizeKey(name);
  return INDIA_STATES.some((s) => normalizeKey(s) === key);
}

function findStateInString(str) {
  const lower = String(str || '').toLowerCase();
  let best = null;
  let bestLen = 0;
  for (const state of INDIA_STATES) {
    if (lower.includes(state.toLowerCase()) && state.length > bestLen) {
      best = state;
      bestLen = state.length;
    }
  }
  return best;
}

function inferStateFromPlace(place) {
  const key = normalizeKey(place);
  if (!key) return null;
  if (CITY_TO_STATE.has(key)) return CITY_TO_STATE.get(key);

  const firstPart = normalizeKey(key.split(',')[0]);
  if (CITY_TO_STATE.has(firstPart)) return CITY_TO_STATE.get(firstPart);

  for (const [city, state] of CITY_TO_STATE.entries()) {
    if (firstPart.includes(city) || city.includes(firstPart)) return state;
  }
  return null;
}

function toDisplayPlace(key) {
  for (const districts of Object.values(DISTRICTS_BY_STATE)) {
    for (const district of districts) {
      if (normalizeKey(district) === key) return district;
    }
  }
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (normalizeKey(alias) === key) {
      return alias
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function inferPlaceFromText(text) {
  if (!text) return '';
  const lower = text.toLowerCase();
  const cities = [...CITY_TO_STATE.keys()].sort((a, b) => b.length - a.length);
  for (const city of cities) {
    const re = new RegExp(`\\b${escapeRegExp(city)}\\b`, 'i');
    if (re.test(lower)) {
      return toDisplayPlace(city);
    }
  }
  return '';
}

function isNonIndiaLocation(loc, text = '') {
  const hay = `${loc} ${text}`.toLowerCase();
  return NON_INDIA_MARKERS.some((m) => hay.includes(m));
}

function formatPlaceAndState(place, state) {
  const p = String(place || '').trim();
  const s = String(state || '').trim();
  if (!p) return s;
  if (!s) return p;
  if (p.toLowerCase().includes(s.toLowerCase())) return p;

  const parts = p.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2 && isIndianState(parts[parts.length - 1])) return p;

  const primary = parts[0];
  return `${primary}, ${s}`;
}

/**
 * Ensure job location includes Indian state when a place is mentioned.
 * Format: "City/Area, State" (e.g. "Ernakulam, Kerala", "Mohali, Punjab").
 */
function normalizeJobLocation(location, explicitState = '', sourceText = '') {
  let loc = String(location || '').trim();
  let state = String(explicitState || '').trim();

  if (!loc) {
    const inferredPlace = inferPlaceFromText(sourceText);
    if (inferredPlace) loc = inferredPlace;
  }

  if (!loc) return { location: '', state };

  if (/^remote$/i.test(loc)) return { location: 'Remote', state: '' };

  const stateInLoc = findStateInString(loc);
  if (stateInLoc) {
    return {
      location: formatPlaceAndState(loc, stateInLoc),
      state: stateInLoc,
    };
  }

  if (state && state !== 'Out of India' && isIndianState(state)) {
    return {
      location: formatPlaceAndState(loc, state),
      state,
    };
  }

  const inferredState = inferStateFromPlace(loc);
  if (inferredState) {
    const primary = loc.split(',')[0].trim();
    return {
      location: formatPlaceAndState(primary, inferredState),
      state: inferredState,
    };
  }

  if (isNonIndiaLocation(loc, sourceText)) {
    return { location: loc, state: 'Out of India' };
  }

  return { location: loc, state };
}

module.exports = {
  INDIA_STATES,
  normalizeJobLocation,
  inferStateFromPlace,
};
