const Plan = require('../models/Plan');

const SEED_PLANS = [
  {
    name: 'Basic', price: 499, order: 0, variant: 'ghost', badge: '', badgeStyle: '',
    description: 'Resume & LinkedIn essentials to help you get noticed.',
    features: ['ATS-optimised resume creation', 'LinkedIn profile optimisation'],
  },
  {
    name: 'Premium', price: 999, order: 1, variant: 'dark', badge: 'Best Value', badgeStyle: 'top-center',
    description: 'Full-service placement with direct company referrals.',
    features: [
      'ATS-optimised resume creation',
      'LinkedIn profile optimisation',
      'Resume distribution services to companies',
      'Direct referrals to partner companies',
      'Dedicated Placement Officer',
      'Mock Interviews with Industry Experts',
    ],
  },
];

const JOB_LINK_PLAN = {
  name: 'JobLinkUnlimited',
  price: 499,
  order: 2,
  variant: 'accent',
  badge: '',
  badgeStyle: '',
  description: 'Unlimited Apply Now on Job Post Links.',
  features: [
    'Unlimited Apply Now through Job Post Links',
    'No weekly 2-apply limit',
    'Skip contribute-to-unlock — apply to every listing',
  ],
  active: true,
};

async function seedIfEmpty() {
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany(SEED_PLANS);
  }
}

async function ensureJobLinkPlan() {
  await Plan.findOneAndUpdate(
    { name: JOB_LINK_PLAN.name },
    { $set: { price: JOB_LINK_PLAN.price }, $setOnInsert: JOB_LINK_PLAN },
    { upsert: true }
  );
}

async function ensurePremiumPlan() {
  const existing = await Plan.findOne({ name: 'Premium' }).lean();
  if (!existing) {
    await Plan.create({
      name: 'Premium',
      price: SEED_PLANS[1].price,
      order: 1,
      variant: 'dark',
      badge: 'Best Value',
      badgeStyle: 'top-center',
      description: SEED_PLANS[1].description,
      features: SEED_PLANS[1].features,
      active: true,
    });
  }
}

exports.getPublicPlans = async (req, res) => {
  try {
    await seedIfEmpty();
    await ensurePremiumPlan();
    await ensureJobLinkPlan();
    const plans = await Plan.find({ active: true }).sort({ order: 1 }).lean();
    // Placement page must always receive Premium pricing even if misconfigured inactive
    const premium = await Plan.findOne({ name: 'Premium' }).lean();
    if (premium && !plans.some((p) => p.name === 'Premium')) {
      plans.push(premium);
      plans.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.adminGetPlans = async (req, res) => {
  try {
    await seedIfEmpty();
    await ensureJobLinkPlan();
    const plans = await Plan.find().sort({ order: 1 }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.getJobLinkUnlimitedPlan = async (req, res) => {
  try {
    await ensureJobLinkPlan();
    const plan = await Plan.findOne({ name: JOB_LINK_PLAN.name, active: true }).lean();
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plan' });
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

    if (plan.name === 'Premium' && req.body.price != null) {
      const SiteConfig = require('../models/SiteConfig');
      const { invalidateCache } = require('../utils/configCache');
      await SiteConfig.findOneAndUpdate(
        { key: 'main' },
        { $set: { premiumServicePricePaise: Math.round(Number(req.body.price) * 100) } },
        { upsert: true }
      );
      invalidateCache();
    }

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
