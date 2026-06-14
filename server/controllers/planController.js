const Plan = require('../models/Plan');

const SEED_PLANS = [
  {
    name: 'Basic', price: 499, order: 0, variant: 'ghost', badge: '', badgeStyle: '',
    description: 'Resume & LinkedIn essentials to help you get noticed.',
    features: ['ATS-optimised resume creation', 'LinkedIn profile optimisation'],
  },
  {
    name: 'Premium', price: 1499, order: 1, variant: 'dark', badge: 'Best Value', badgeStyle: 'top-center',
    description: 'Full-service placement with direct company referrals.',
    features: [
      'ATS-optimised resume creation',
      'LinkedIn profile optimisation',
      'Resume distribution services to companies',
      'Direct referrals to partner companies',
      'Dedicated placement manager',
    ],
  },
  {
    name: 'Standard', price: 999, order: 2, variant: 'accent', badge: '', badgeStyle: '',
    description: 'Resume & LinkedIn essentials plus distribution to companies.',
    features: [
      'ATS-optimised resume creation',
      'LinkedIn profile optimisation',
      'Resume distribution services to companies',
    ],
  },
];

async function seedIfEmpty() {
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany(SEED_PLANS);
  } else {
    for (const planData of SEED_PLANS) {
      await Plan.findOneAndUpdate(
        { name: planData.name },
        { $set: { badge: planData.badge, badgeStyle: planData.badgeStyle, features: planData.features, description: planData.description, variant: planData.variant, order: planData.order } },
        { upsert: false }
      );
    }
  }
}

exports.getPublicPlans = async (req, res) => {
  try {
    await seedIfEmpty();
    const plans = await Plan.find({ active: true }).sort({ order: 1 }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.adminGetPlans = async (req, res) => {
  try {
    await seedIfEmpty();
    const plans = await Plan.find().sort({ order: 1 }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.adminCreatePlan = async (req, res) => {
  try {
    const count = await Plan.countDocuments();
    const plan = await Plan.create({ ...req.body, order: count });
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.adminUpdatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.adminDeletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
