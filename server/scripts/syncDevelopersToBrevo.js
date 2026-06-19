/**
 * Syncs all active developers from MongoDB into a Brevo contact list.
 *
 * Run:
 *   node server/scripts/syncDevelopersToBrevo.js              # sync to default list
 *   node server/scripts/syncDevelopersToBrevo.js --list=5     # sync to list ID 5
 *   node server/scripts/syncDevelopersToBrevo.js --dry-run    # preview without touching Brevo
 *
 * Find your LIST_ID in Brevo: Contacts → Lists → click your list → check URL (?id=XX)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Brevo = require('@getbrevo/brevo');
const User = require('../models/User');

// ── CONFIG ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const listArg = args.find(a => a.startsWith('--list='));
const LIST_ID = listArg ? parseInt(listArg.split('=')[1], 10) : 3; // ← change default
const BATCH_SIZE = 150; // Brevo importContacts max per call
// ─────────────────────────────────────────────────────────────────────────────

const contactsApi = new Brevo.ContactsApi();
contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const developers = await User.find(
    { userType: 'developer', isDeleted: false },
    'name email phone place state yearsOfExperience badge createdAt'
  ).lean();

  console.log(`Found ${developers.length} active developers`);

  if (DRY_RUN) {
    console.log('\n=== DRY RUN — first 3 contacts that would be synced ===');
    developers.slice(0, 3).forEach(u => console.log(`  ${u.email} — ${u.name}`));
    console.log(`\n${developers.length} contacts would be imported into list ID ${LIST_ID}.`);
    console.log('Run without --dry-run to sync.');
    await mongoose.disconnect();
    return;
  }

  const batches = chunk(developers, BATCH_SIZE);
  let synced = 0;

  for (const [i, batch] of batches.entries()) {
    const jsonBody = batch.map(u => ({
      email: u.email,
      attributes: {
        FIRSTNAME: u.name,
        SMS: u.phone || '',
        LOCATION: [u.place, u.state].filter(Boolean).join(', '),
        EXPERIENCE: u.yearsOfExperience || '',
        BADGE: u.badge || 'new_member',
        JOINED: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      },
    }));

    await contactsApi.importContacts({
      listIds: [LIST_ID],
      jsonBody,
      emailBlacklist: false,
      smsBlacklist: false,
      updateExistingContacts: true,
      emptyContactsAttributes: false,
    });

    synced += batch.length;
    console.log(`Batch ${i + 1}/${batches.length} — ${synced}/${developers.length} synced`);
  }

  console.log(`\nDone. ${synced} developers synced to Brevo list ID ${LIST_ID}.`);
  console.log(`View list: https://app.brevo.com/contact/list/id/${LIST_ID}`);
  await mongoose.disconnect();
})().catch(err => {
  console.error('Error:', err.response?.body || err.message);
  mongoose.disconnect();
  process.exit(1);
});
