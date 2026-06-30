const mongoose = require('mongoose');

// Single-document config store — always upserted by key "main"
const siteConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },

  // JD analysis plan
  jdFreeLimit:       { type: Number, default: 5 },   // free analyses per month
  jdPaidPackSize:    { type: Number, default: 5 },   // analyses per paid pack
  jdPackPricePaise:  { type: Number, default: 49900 }, // ₹499 in paise
  jdFeatureEnabled:  { type: Boolean, default: true },

  // Free premium offer
  freeOfferEnabled:         { type: Boolean, default: true },
  freeOfferDueDate:         { type: Date, default: null },
  premiumServicePricePaise: { type: Number, default: 99900 }, // ₹999 in paise
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
