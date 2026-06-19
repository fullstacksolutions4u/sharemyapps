/**
 * Splits active developers from MongoDB into 3 Brevo lists (~100 each).
 *
 * Run:
 *   node server/scripts/splitDevelopersToBrevo.js --dry-run
 *   node server/scripts/splitDevelopersToBrevo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Brevo = require('@getbrevo/brevo');
const User = require('../models/User');

const LIST_IDS = [5, 6, 7]; // Batch 1, Batch 2, Batch 3
const DRY_RUN = process.argv.includes('--dry-run');

const contactsApi = new Brevo.ContactsApi();
contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

async function importBatch(contacts, listId) {
  await contactsApi.importContacts({
    listIds: [listId],
    jsonBody: contacts.map(u => ({
      email: u.email,
      attributes: {
        FIRSTNAME: u.name,
        SMS: u.phone || '',
        LOCATION: [u.place, u.state].filter(Boolean).join(', '),
        EXPERIENCE: u.yearsOfExperience || '',
        BADGE: u.badge || 'new_member',
        JOINED: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      },
    })),
    emailBlacklist: false,
    smsBlacklist: false,
    updateExistingContacts: true,
    emptyContactsAttributes: false,
  });
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const developers = await User.find(
    { userType: 'developer', isDeleted: false },
    'name email phone place state yearsOfExperience badge createdAt'
  ).lean();

  const total = developers.length;
  const batchSize = Math.ceil(total / 3);

  const batches = [
    developers.slice(0, batchSize),
    developers.slice(batchSize, batchSize * 2),
    developers.slice(batchSize * 2),
  ];

  console.log(`Total: ${total} developers`);
  batches.forEach((b, i) =>
    console.log(`  Batch ${i + 1} → List #${LIST_IDS[i]}: ${b.length} contacts`)
  );

  if (DRY_RUN) {
    console.log('\nDry run — no changes made. Remove --dry-run to sync.');
    await mongoose.disconnect();
    return;
  }

  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`Importing Batch ${i + 1} into list #${LIST_IDS[i]}...`);
    await importBatch(batches[i], LIST_IDS[i]);
    console.log(` done (${batches[i].length} contacts)`);
  }

  console.log('\nAll 3 batches synced.');
  console.log('  Batch 1 (list #5): https://app.brevo.com/contact/list/id/5');
  console.log('  Batch 2 (list #6): https://app.brevo.com/contact/list/id/6');
  console.log('  Batch 3 (list #7): https://app.brevo.com/contact/list/id/7');

  await mongoose.disconnect();
})().catch(err => {
  console.error('Error:', err.response?.body || err.message);
  mongoose.disconnect();
  process.exit(1);
});
