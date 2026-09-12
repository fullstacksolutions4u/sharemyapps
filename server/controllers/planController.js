const planService = require('../services/plan.service');
const PlanDto = require('../dtos/plan.dto');

exports.getPublicPlans = async (req, res, next) => {
  try {
    const plans = await planService.getPublicPlans();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.adminGetPlans = async (req, res, next) => {
  try {
    const plans = await planService.adminGetPlans();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.getJobLinkUnlimitedPlan = async (req, res, next) => {
  try {
    const plan = await planService.getJobLinkUnlimitedPlan();
    res.json(plan);
  } catch (err) {
    console.error('getJobLinkUnlimitedPlan error:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Failed to load plan' });
  }
};

exports.adminCreatePlan = async (req, res, next) => {
  try {
    const data = PlanDto.validateCreate(req.body);
    const plan = await planService.adminCreatePlan(data);
    res.status(201).json(plan);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.adminUpdatePlan = async (req, res, next) => {
  try {
    const data = PlanDto.validateUpdate(req.body);
    const plan = await planService.adminUpdatePlan(req.params.id, data);
    res.json(plan);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.adminDeletePlan = async (req, res, next) => {
  try {
    const result = await planService.adminDeletePlan(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};
