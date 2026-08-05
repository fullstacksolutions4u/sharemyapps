const JOB_LINK_UNLIMITED_KEYS = ['job_link_unlimited_apply', 'placement_session'];

function hasJobLinkUnlimitedApply(premiumServices = []) {
  return premiumServices.some((s) => JOB_LINK_UNLIMITED_KEYS.includes(s.key));
}

module.exports = {
  JOB_LINK_UNLIMITED_KEYS,
  hasJobLinkUnlimitedApply,
};
