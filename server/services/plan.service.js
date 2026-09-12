const planRepo = require('../repositories/plan.repository');
const { invalidateCache } = require('../utils/configCache');

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
  price: 199,
  order: 2,
  variant: 'accent',
  badge: '',
  badgeStyle: '',
  description: 'Unlimited Apply Now on Job Post Links.',
  features: [
    'Unlimited Apply Now through Job Post Links',
    'No weekly 3-apply limit',
    'Skip contribute-to-unlock — apply to every listing',
  ],
  active: true,
};

class PlanService {
  async seedIfEmpty() {
    const count = await planRepo.countPlans();
    if (count === 0) {
      await planRepo.insertMany(SEED_PLANS);
    }
  }

  async ensureJobLinkPlan() {
    const existing = await planRepo.findPlanByName(JOB_LINK_PLAN.name);
    if (!existing) {
      await planRepo.createPlan(JOB_LINK_PLAN);
      return;
    }
    if (!existing.active) {
      await planRepo.updatePlanStatus(JOB_LINK_PLAN.name, true);
    }
  }

  async ensurePremiumPlan() {
    const existing = await planRepo.findPlanByNameLean('Premium');
    if (!existing) {
      await planRepo.createPlan({
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

  async getPublicPlans() {
    await this.seedIfEmpty();
    await this.ensurePremiumPlan();
    await this.ensureJobLinkPlan();

    const plans = await planRepo.findActivePlans();
    const premium = await planRepo.findPlanByNameLean('Premium');
    if (premium && !plans.some((p) => p.name === 'Premium')) {
      plans.push(premium);
      plans.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return plans;
  }

  async adminGetPlans() {
    await this.seedIfEmpty();
    await this.ensureJobLinkPlan();
    return await planRepo.findAllPlans();
  }

  async getJobLinkUnlimitedPlan() {
    await this.ensureJobLinkPlan();
    const plan = await planRepo.findPlanByNameLean(JOB_LINK_PLAN.name);
    if (!plan || !plan.active) {
      const err = new Error('Plan not found'); err.status = 404; throw err;
    }
    return plan;
  }

  async adminCreatePlan(data) {
    const count = await planRepo.countPlans();
    return await planRepo.createPlan({ ...data, order: count });
  }

  async adminUpdatePlan(id, data) {
    const plan = await planRepo.updatePlanById(id, data);
    if (!plan) {
      const err = new Error('Plan not found'); err.status = 404; throw err;
    }

    if (plan.name === 'Premium' && data.price != null) {
      const pricePaise = Math.round(Number(data.price) * 100);
      await planRepo.updatePremiumServicePrice(pricePaise);
      invalidateCache();
    }

    return plan;
  }

  async adminDeletePlan(id) {
    const plan = await planRepo.deletePlanById(id);
    if (!plan) {
      const err = new Error('Plan not found'); err.status = 404; throw err;
    }
    return { message: 'Deleted' };
  }
}

module.exports = new PlanService();
