const SiteConfig = require('../models/SiteConfig');
const { invalidateCache, getConfig } = require('../utils/configCache');

const getAdminConfig = async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAdminConfig = async (req, res) => {
  try {
    const allowed = ['jdFreeLimit', 'jdPaidPackSize', 'jdPackPricePaise', 'jdFeatureEnabled'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    await SiteConfig.findOneAndUpdate(
      { key: 'main' },
      { $set: update },
      { upsert: true, new: true }
    );

    invalidateCache();
    const fresh = await getConfig();
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAdminConfig, updateAdminConfig };
