const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  description: { type: String, default: '', trim: true },
  features:    [{ type: String, trim: true }],
  badge:       { type: String, default: '' },
  badgeStyle:  { type: String, enum: ['top-center', 'inline', ''], default: '' },
  variant:     { type: String, enum: ['ghost', 'accent', 'dark'], default: 'ghost' },
  order:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

planSchema.index({ order: 1 });

module.exports = mongoose.model('Plan', planSchema);
