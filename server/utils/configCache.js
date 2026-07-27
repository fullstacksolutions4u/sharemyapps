const SiteConfig = require('../models/SiteConfig');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache = null;
let cacheTime = 0;

const DEFAULTS = {
  jdFreeLimit:      5,
  jdPaidPackSize:   5,
  jdPackPricePaise: 49900,
  jdFeatureEnabled: true,
  freeOfferEnabled: true,
  premiumServicePricePaise: 99900,
  rank1OfferPricePaise: 49900,
};

async function getConfig() {
  if (cache && Date.now() - cacheTime < CACHE_TTL_MS) return cache;
  try {
    const doc = await SiteConfig.findOne({ key: 'main' }).lean();
    cache = doc ? { ...DEFAULTS, ...doc } : { ...DEFAULTS };
  } catch {
    cache = cache || { ...DEFAULTS };
  }
  cacheTime = Date.now();
  return cache;
}

function invalidateCache() {
  cache = null;
  cacheTime = 0;
}

module.exports = { getConfig, invalidateCache };
