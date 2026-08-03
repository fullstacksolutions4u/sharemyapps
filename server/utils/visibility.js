/**
 * Private visibility pair: Tony ↔ Amir Ali.
 * Each can see the other; neither appears publicly; other users (including other
 * hidden accounts) cannot see them. Admins can see everyone.
 */
const PRIVATE_PAIR_EMAILS = [
  't4tonykuriakose@gmail.com', // Tony
  'cv4amirali@gmail.com', // Amir Ali
];

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function isPrivatePairEmail(email) {
  return PRIVATE_PAIR_EMAILS.includes(normalizeEmail(email));
}

function isPrivatePairUser(user) {
  return Boolean(user && isPrivatePairEmail(user.email));
}

function idsEqual(a, b) {
  return Boolean(a && b && String(a._id || a) === String(b._id || b));
}

/** Can viewer see this target user on public surfaces? */
function canSeeUser(viewer, target) {
  if (!target) return false;
  if (viewer && idsEqual(viewer, target)) return true;
  if (viewer?.role === 'admin') return true;

  // Pair accounts are only visible to each other (not to other hidden users)
  if (isPrivatePairUser(target)) {
    return isPrivatePairUser(viewer);
  }

  if (!target.hidden) return true;

  // Other hidden users: legacy — visible to non-pair hidden viewers
  if (isPrivatePairUser(viewer)) return false;
  return Boolean(viewer?.hidden);
}

/** Admin or legacy hidden (non-pair) may browse all non-pair hidden content. */
function canBrowseAllHidden(viewer) {
  if (!viewer) return false;
  if (viewer.role === 'admin') return true;
  if (isPrivatePairUser(viewer)) return false;
  return Boolean(viewer.hidden);
}

/**
 * Hidden user IDs the viewer must not see in lists / feeds / portfolios.
 */
async function getExcludedHiddenUserIds(viewer, User) {
  if (viewer?.role === 'admin') return [];
  const hiddenUsers = await User.find({ hidden: true }).select('_id email role hidden').lean();
  return hiddenUsers.filter((u) => !canSeeUser(viewer, u)).map((u) => u._id);
}

/**
 * User-query visibility clause. Pair members get partner included; public excludes all hidden.
 */
async function getUserVisibilityClause(viewer, User) {
  if (viewer?.role === 'admin') return {};
  if (canBrowseAllHidden(viewer)) {
    // Still exclude private-pair members from other hidden users' views
    const excluded = await getExcludedHiddenUserIds(viewer, User);
    return excluded.length ? { _id: { $nin: excluded } } : {};
  }
  if (isPrivatePairUser(viewer)) {
    const excluded = await getExcludedHiddenUserIds(viewer, User);
    return excluded.length ? { _id: { $nin: excluded } } : {};
  }
  return { hidden: { $ne: true } };
}

/** Partner ObjectId for a private-pair viewer, or null. */
async function getPrivatePairPartnerId(viewer, User) {
  if (!isPrivatePairUser(viewer)) return null;
  const myEmail = normalizeEmail(viewer.email);
  const partnerEmail = PRIVATE_PAIR_EMAILS.find((e) => e !== myEmail);
  if (!partnerEmail) return null;
  const partner = await User.findOne({ email: partnerEmail }).select('_id').lean();
  return partner?._id || null;
}

module.exports = {
  PRIVATE_PAIR_EMAILS,
  isPrivatePairEmail,
  isPrivatePairUser,
  canSeeUser,
  canBrowseAllHidden,
  getExcludedHiddenUserIds,
  getUserVisibilityClause,
  getPrivatePairPartnerId,
};
