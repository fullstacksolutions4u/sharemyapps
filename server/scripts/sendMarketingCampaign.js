/**
 * Creates and sends an email campaign via Brevo's Campaign API.
 *
 * Run:  node server/scripts/sendMarketingCampaign.js
 *
 * Before running:
 *   1. Find your Brevo list ID: Contacts → Lists → click your list → check the URL (?id=XX)
 *   2. Set LIST_ID below (or pass --list=XX as a CLI arg)
 *   3. Add --dry-run to create the campaign in draft mode without sending
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Brevo = require('@getbrevo/brevo');

// ── CONFIG ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const listArg = args.find(a => a.startsWith('--list='));
const LIST_ID = listArg ? parseInt(listArg.split('=')[1], 10) : 3; // ← change default list ID

const BASE_URL = process.env.CLIENT_URL || 'https://sharemyapps.in';
const LOGO_URL = 'https://res.cloudinary.com/di0vbvioi/image/upload/v1780659567/sharemyapp/logo.png';
const HR_URL   = `${BASE_URL}/hr-services`;
// ────────────────────────────────────────────────────────────────────────────

const api = new Brevo.EmailCampaignsApi();
api.setApiKey(Brevo.EmailCampaignsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const FOOTER = `
  <div style="background:#F3F0EB;padding:16px 32px;text-align:center;">
    <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;">You received this because you are a registered developer on ShareMyApps.</p>
    <p style="color:#9CA3AF;font-size:11px;margin:0;">ShareMyApps · hello@sharemyapps.in</p>
  </div>
`;

const HTML = `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E1DA;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#00A693 0%,#007A6D 100%);padding:32px;text-align:center;">
    <img src="${LOGO_URL}" alt="ShareMyApps" style="height:64px;object-fit:contain;" />
    <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">Placement Support · Exclusively for Our Members</p>
  </div>

  <!-- Hook -->
  <div style="padding:36px 36px 0;">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">
      Still waiting for that one reply?
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      You spent hours tailoring your resume, wrote a perfect cover letter, hit <em>Apply</em> — and heard nothing. Then did it again. And again. <strong>No reply. No interview. No feedback.</strong>
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
      The job market is brutal. ATS filters, ghost recruiters, hundreds of applicants per role. <strong>It's not your fault — the system is broken.</strong>
    </p>
  </div>

  <!-- Pain stat -->
  <div style="margin:0 36px;padding:20px 24px;background:#FFF7ED;border-left:4px solid #F97316;border-radius:0 10px 10px 0;">
    <p style="margin:0;font-size:15px;font-weight:700;color:#C2410C;">The average developer sends 80+ applications before landing an interview.</p>
    <p style="margin:6px 0 0;font-size:13px;color:#9A3412;">That's weeks of effort with no guarantee of even a callback.</p>
  </div>

  <!-- Solution -->
  <div style="padding:28px 36px 0;">
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">We apply for you — the right way.</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      ShareMyApps now offers a <strong>dedicated HR team</strong> that handles your job search end-to-end. Real people. Real connections. Personalized outreach — not bulk spam.
    </p>
  </div>

  <!-- Plans -->
  <div style="padding:0 36px 28px;">
    <table style="width:100%;border-collapse:separate;border-spacing:12px;">
      <tr>
        <!-- Basic -->
        <td style="width:50%;vertical-align:top;border:1px solid #E5E7EB;border-radius:12px;padding:20px;background:#F9FAFB;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6B7280;">Basic</p>
          <p style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;">&#8377;499</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">&#10003; Resume review &amp; expert feedback</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">&#10003; LinkedIn &amp; GitHub profile tips</p>
          <p style="margin:0;padding:6px 0;font-size:13px;color:#374151;">&#10003; 48-hr turnaround</p>
        </td>
        <!-- Standard -->
        <td style="width:50%;vertical-align:top;border:2px solid #00A693;border-radius:12px;padding:20px;background:#F0FDFB;position:relative;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#00A693;">&#11088; Standard — Most Popular</p>
          <p style="margin:0 0 2px;font-size:26px;font-weight:800;color:#111827;">&#8377;999</p>
          <p style="margin:0 0 14px;font-size:11px;color:#6B7280;">one-time &middot; no hidden fees</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #D1FAF5;font-size:13px;color:#374151;">&#10003; Everything in Basic</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #D1FAF5;font-size:13px;color:#374151;">&#10003; <strong>10 targeted job applications</strong> by HR</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #D1FAF5;font-size:13px;color:#374151;">&#10003; Weekly progress updates</p>
          <p style="margin:0;padding:6px 0;border-bottom:1px solid #D1FAF5;font-size:13px;color:#374151;">&#10003; Personalized cover letters per role</p>
          <p style="margin:0;padding:6px 0;font-size:13px;font-weight:700;color:#DC2626;">&#128274; Full refund if zero callbacks*</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Guarantee -->
  <div style="margin:0 36px 28px;padding:22px 24px;background:linear-gradient(135deg,#FEF2F2 0%,#FFF5F5 100%);border:1px solid #FECACA;border-radius:12px;text-align:center;">
    <p style="margin:0 0 6px;font-size:26px;">&#128737;&#65039;</p>
    <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#991B1B;">Zero-Risk Guarantee</p>
    <p style="margin:0;font-size:14px;color:#7F1D1D;line-height:1.7;">
      If you don't receive <strong>a single interview callback</strong> from our 10 applications within <strong>30 days</strong>, we'll refund your entire &#8377;999. No questions asked.
    </p>
  </div>

  <!-- Trust signals -->
  <div style="padding:0 36px 28px;">
    <table style="width:100%;border-collapse:separate;border-spacing:10px;">
      <tr>
        <td style="text-align:center;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">48h</p>
          <p style="margin:0;font-size:12px;color:#6B7280;">Service activation</p>
        </td>
        <td style="text-align:center;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">10+</p>
          <p style="margin:0;font-size:12px;color:#6B7280;">Targeted applications</p>
        </td>
        <td style="text-align:center;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">100%</p>
          <p style="margin:0;font-size:12px;color:#6B7280;">Money-back guarantee</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:0 36px 36px;text-align:center;">
    <a href="${HR_URL}" style="display:inline-block;background:linear-gradient(135deg,#00A693 0%,#007A6D 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.02em;">
      Claim My &#8377;999 Plan &rarr;
    </a>
    <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">Spots are limited. Our HR team handles requests one at a time.</p>

    <div style="margin-top:24px;padding:16px;background:#FFFBF0;border-radius:10px;border:1px solid #FDE68A;text-align:left;">
      <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
        <strong>P.S.</strong> &mdash; You already built the apps. You have the skills. The only thing missing is someone who knows <em>how to get them seen</em>. Don't let another month pass without a single interview.
      </p>
    </div>
  </div>

  <!-- Fine print -->
  <div style="padding:0 36px 20px;">
    <p style="margin:0;font-size:11px;color:#D1D5DB;line-height:1.5;">
      *Refund applies to the Standard (&#8377;999) plan only. Requires a valid resume, completed job preference form, and no rejection of applications by the developer. Processed within 7 business days of claim.
    </p>
  </div>

  ${FOOTER}
</div>
`;

(async () => {
  const campaignData = {
    name: `ShareMyApps HR Services — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    subject: "You've sent 50+ apps. We'll send 10 that actually land interviews — or your ₹999 back.",
    sender: { name: 'ShareMyApps', email: process.env.EMAIL_FROM || 'hello@sharemyapps.in' },
    recipients: { listIds: [LIST_ID] },
    htmlContent: HTML,
  };

  if (DRY_RUN) {
    console.log('=== DRY RUN — Campaign would be created with: ===');
    console.log(`  Name:     ${campaignData.name}`);
    console.log(`  Subject:  ${campaignData.subject}`);
    console.log(`  List ID:  ${LIST_ID}`);
    console.log('\nRun without --dry-run to create and send.');
    return;
  }

  try {
    console.log('Creating campaign on Brevo...');
    const result = await api.createEmailCampaign(campaignData);
    const campaignId = result.body.id;
    console.log(`Campaign created. ID: ${campaignId}`);

    console.log('Sending now...');
    await api.sendEmailCampaignNow(campaignId);
    console.log('Campaign sent successfully!');
    console.log(`Check results at: https://app.brevo.com/email-campaigns/report?id=${campaignId}`);
  } catch (err) {
    console.error('Error:', err.response?.body || err.message);
    process.exit(1);
  }
})();
