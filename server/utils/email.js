const Brevo = require('@getbrevo/brevo');

const api = new Brevo.TransactionalEmailsApi();
api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
const BASE_URL   = process.env.CLIENT_URL || 'http://localhost:5173';
const LOGO_URL   = 'https://res.cloudinary.com/di0vbvioi/image/upload/v1780659567/sharemyapp/logo.png';
const LINKEDIN_URL = 'https://linkedin.com/company/sharemyapps';
const FROM = { name: 'ShareMyApps', email: process.env.EMAIL_FROM || 'hello@sharemyapps.in' };

const FOOTER = (text) => `
  <div style="background:#F3F0EB;padding:16px 32px;text-align:center;">
    <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;">${text}</p>
    <a href="${LINKEDIN_URL}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#0A66C2;font-size:12px;font-weight:600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      Follow us on LinkedIn
    </a>
  </div>
`;

exports.sendFeedbackEmail = async ({ senderName, senderEmail, text }) => {
  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: 'hello@sharemyapps.in', name: 'ShareMyApps' }],
    replyTo: { email: senderEmail, name: senderName },
    subject: `New Feedback from ${senderName}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1A1A1A;">New Feedback Received</h2>
          <p style="color:#374151;margin:0 0 4px;font-size:13px;"><strong>From:</strong> ${senderName} (${senderEmail})</p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-top:16px;white-space:pre-wrap;font-size:14px;color:#374151;">${text}</div>
        </div>
        ${FOOTER('This is an automated notification from ShareMyApps feedback form.')}
      </div>
    `,
  });
};

exports.sendProjectApprovedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const projectUrl = `${BASE_URL}/project/${projectId}`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `"${projectTitle}" is now live @ ShareMyApps`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">🎉 Your project is live!</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            Great news — your project <strong>"${projectTitle}"</strong> has been approved by our team and is now publicly visible on ShareMyApps.
          </p>
          ${adminNote ? `
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#166534;"><strong>Admin tip:</strong> ${adminNote}</p>
          </div>` : ''}
          <a href="${projectUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            View your project →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            Now recruiters, clients, and mentoring students can explore your projects on ShareMyApps.
          </p>
        </div>
        ${FOOTER('You received this email because you submitted a project on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendOtpEmail = async ({ to, otp }) => {
  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to }],
    subject: 'Your ShareMyApps password reset OTP',
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#FAF9F6;border-radius:16px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:20px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:36px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">Reset your password</h2>
          <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">Use the one-time code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;background:#fff;border:1px solid #E5E1DA;border-radius:12px;padding:28px;">
            <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#00A693;">${otp}</span>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        ${FOOTER('You received this because a password reset was requested on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendCollaboratorAddedEmail = async ({ to, name, addedByName, projectTitle, projectId }) => {
  const projectUrl = `${BASE_URL}/project/${projectId}`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `${addedByName} added you as a collaborator on "${projectTitle}"`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">👥 You've been added as a collaborator!</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            <strong>${addedByName}</strong> has added you as a collaborator on the project
            <strong>"${projectTitle}"</strong> on ShareMyApps. Your name will now appear on the project page.
          </p>
          <a href="${projectUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            View project →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            This project is now linked to your profile. Share it to showcase your work.
          </p>
        </div>
        ${FOOTER('You received this because someone added you as a collaborator on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendPlacementPaymentEmail = async ({ to, name, plan }) => {
  const featureRows = plan.features.map(f =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #F3F0EB;font-size:13px;color:#374151;">✓ ${f}</td></tr>`
  ).join('');

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Payment Confirmed – ${plan.name} Plan | ShareMyApps`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 6px;font-size:20px;color:#1A1A1A;">Payment Confirmed!</h2>
          <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">Hi ${name}, thank you for choosing ShareMyApps Premium Plans.</p>

          <!-- Plan summary box -->
          <div style="background:#FFFBF0;border:1px solid #F59E0B;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B45309;">${plan.name} Plan</p>
            <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1A1A1A;">₹${Number(plan.price).toLocaleString('en-IN')} <span style="font-size:13px;font-weight:400;color:#6B7280;">one-time payment</span></p>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Included services</p>
            <table style="width:100%;border-collapse:collapse;">
              ${featureRows}
            </table>
          </div>

          <!-- Activation notice -->
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#1E40AF;font-weight:600;">⏱ Services activate within 3 business days</p>
            <p style="margin:6px 0 0;font-size:13px;color:#3B82F6;">Our HR team will review your profile and reach out to you within 3 business days to kick off your placement support.</p>
          </div>

          <!-- Contact block -->
          <p style="margin:0 0 12px;font-size:13px;color:#374151;">Have questions? Reach us anytime:</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 14px;background:#F9F8F6;border-radius:8px;font-size:13px;color:#374151;">
                📧 <a href="mailto:hello@sharemyapps.in" style="color:#00A693;text-decoration:none;font-weight:600;">hello@sharemyapps.in</a>
              </td>
            </tr>
            <tr><td style="height:8px;"></td></tr>
            <tr>
              <td style="padding:10px 14px;background:#F9F8F6;border-radius:8px;font-size:13px;color:#374151;">
                📞 <a href="tel:+918848118585" style="color:#00A693;text-decoration:none;font-weight:600;">+91 8848118585</a>
              </td>
            </tr>
          </table>
        </div>
        ${FOOTER('You received this email because you purchased a Premium Plan on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendMarketingCampaignEmail = async ({ to, name }) => {
  const hrUrl = `${BASE_URL}/hr-services`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `You've sent 50+ apps. We'll send 10 that actually land interviews — or your ₹999 back.`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E1DA;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#00A693 0%,#007A6D 100%);padding:32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:64px;object-fit:contain;" />
          <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">Placement Support · Exclusively for Our Members</p>
        </div>

        <!-- Pain-point hook -->
        <div style="padding:36px 36px 0;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">
            Still waiting for that one reply?
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
            Hi ${name},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
            We know the feeling. You spent hours tailoring your resume, wrote a perfect cover letter, hit <em>Apply</em> — and heard nothing. Then you did it again. And again. <strong>No reply. No interview. No feedback.</strong>
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
            The job market in 2025 is brutal. ATS filters, ghost recruiters, and hundreds of applicants for every role. <strong>It's not your fault — the system is broken.</strong>
          </p>
        </div>

        <!-- Divider with callout -->
        <div style="margin:0 36px;padding:20px 24px;background:#FFF7ED;border-left:4px solid #F97316;border-radius:0 10px 10px 0;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#C2410C;">The average developer sends 80+ applications before landing an interview.</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9A3412;">That's weeks of effort with no guarantee of even a callback.</p>
        </div>

        <!-- Solution section -->
        <div style="padding:28px 36px 0;">
          <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">We apply for you — the right way.</h2>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
            ShareMyApps now offers a <strong>dedicated HR team</strong> that handles your job search end-to-end. Real people. Real connections. Personalized outreach — not bulk spam.
          </p>
        </div>

        <!-- Plans comparison -->
        <div style="padding:0 36px 28px;display:flex;gap:16px;">

          <!-- Basic Plan -->
          <div style="flex:1;border:1px solid #E5E7EB;border-radius:12px;padding:20px;background:#F9FAFB;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6B7280;">Basic</p>
            <p style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;">₹499</p>
            <ul style="margin:0;padding:0 0 0 4px;list-style:none;">
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #F3F4F6;">✅ Resume review &amp; expert feedback</li>
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #F3F4F6;">✅ LinkedIn &amp; GitHub profile tips</li>
              <li style="font-size:13px;color:#374151;padding:5px 0;">✅ 48-hr turnaround</li>
            </ul>
          </div>

          <!-- Standard Plan — hero -->
          <div style="flex:1;border:2px solid #00A693;border-radius:12px;padding:20px;background:#F0FDFB;position:relative;">
            <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#00A693;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 14px;border-radius:20px;white-space:nowrap;">Most Popular</div>
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#00A693;">Standard</p>
            <p style="margin:0 0 2px;font-size:26px;font-weight:800;color:#111827;">₹999</p>
            <p style="margin:0 0 16px;font-size:11px;color:#6B7280;">one-time · no hidden fees</p>
            <ul style="margin:0;padding:0 0 0 4px;list-style:none;">
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #D1FAF5;">✅ Everything in Basic</li>
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #D1FAF5;">✅ <strong>10 targeted job applications</strong> by our HR team</li>
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #D1FAF5;">✅ Weekly progress updates</li>
              <li style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #D1FAF5;">✅ Personalized cover letters per role</li>
              <li style="font-size:13px;font-weight:700;color:#DC2626;padding:5px 0;">🔒 Full refund if zero callbacks*</li>
            </ul>
          </div>
        </div>

        <!-- Refund guarantee callout -->
        <div style="margin:0 36px 28px;padding:20px 24px;background:linear-gradient(135deg,#FEF2F2 0%,#FFF5F5 100%);border:1px solid #FECACA;border-radius:12px;text-align:center;">
          <p style="margin:0 0 6px;font-size:22px;">🛡️</p>
          <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#991B1B;">Zero-Risk Guarantee</p>
          <p style="margin:0;font-size:14px;color:#7F1D1D;line-height:1.6;">
            We're so confident in our team that if you don't receive <strong>a single interview callback</strong> from our 10 applications within <strong>30 days</strong>, we'll refund your entire ₹999. No questions asked.
          </p>
        </div>

        <!-- Social proof / trust signals -->
        <div style="margin:0 36px 28px;display:flex;gap:12px;text-align:center;">
          <div style="flex:1;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">48h</p>
            <p style="margin:0;font-size:12px;color:#6B7280;">Avg. service activation</p>
          </div>
          <div style="flex:1;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">10+</p>
            <p style="margin:0;font-size:12px;color:#6B7280;">Targeted applications sent</p>
          </div>
          <div style="flex:1;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#00A693;">100%</p>
            <p style="margin:0;font-size:12px;color:#6B7280;">Money-back if no callbacks</p>
          </div>
        </div>

        <!-- CTA -->
        <div style="padding:0 36px 36px;text-align:center;">
          <a href="${hrUrl}" style="display:inline-block;background:linear-gradient(135deg,#00A693 0%,#007A6D 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(0,166,147,0.35);">
            Claim My ₹999 Plan →
          </a>
          <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">Spots are limited. Our HR team handles requests one at a time.</p>

          <!-- PS line -->
          <div style="margin-top:24px;padding:16px;background:#FFFBF0;border-radius:10px;border:1px solid #FDE68A;text-align:left;">
            <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
              <strong>P.S.</strong> — You already built the apps. You have the skills. The only thing missing is someone who knows <em>how to get them seen</em>. That's exactly what we do. Don't let another month go by without a single interview.
            </p>
          </div>
        </div>

        <!-- Fine print -->
        <div style="padding:0 36px 20px;">
          <p style="margin:0;font-size:11px;color:#D1D5DB;line-height:1.5;">
            *Refund applies to the Standard (₹999) plan only. Eligibility requires a valid, up-to-date resume, completion of the job preference form, and no rejection of applications by the developer. Refund processed within 7 business days of claim.
          </p>
        </div>

        ${FOOTER('You received this because you are a registered developer on ShareMyApps. To unsubscribe, reply with "unsubscribe".')}
      </div>
    `,
  });
};

exports.sendJobApplicationEmail = async ({ to, name, vacancy }) => {
  const vacanciesUrl = `${BASE_URL}/vacancies`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Application submitted – ${vacancy.title}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">Application Received!</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            You've successfully applied for the <strong>${vacancy.title}</strong> position. The recruiter will directly contact you if your profile matches their requirements.
          </p>
          <p style="color:#6B7280;font-size:13px;margin:0 0 20px;line-height:1.7;">
            There are some vacancies that are not listed and you don't need to apply — recruiters will directly contact you based on your skills and projects you've added. So make sure your profile is always up to date. Add your latest resume, showcase your projects, and keep your skills current to increase your chances of getting noticed. Also, practice and sharpen your skills using Quiz Zone.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <tr>
              <td style="padding:0 6px 0 0;">
                <a href="${BASE_URL}/profile" style="display:block;text-align:center;background:#00A693;color:#fff;text-decoration:none;padding:11px 10px;border-radius:8px;font-weight:600;font-size:13px;">
                  Complete Profile
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="${BASE_URL}/vacancies" style="display:block;text-align:center;background:#1D4ED8;color:#fff;text-decoration:none;padding:11px 10px;border-radius:8px;font-weight:600;font-size:13px;">
                  More Opportunities
                </a>
              </td>
              <td style="padding:0 0 0 6px;">
                <a href="${BASE_URL}/dashboard/tick2test" style="display:block;text-align:center;background:#7C3AED;color:#fff;text-decoration:none;padding:11px 10px;border-radius:8px;font-weight:600;font-size:13px;">
                  Quiz Zone
                </a>
              </td>
            </tr>
            <tr><td colspan="3" style="height:10px;"></td></tr>
            <tr>
              <td colspan="3">
                <a href="${BASE_URL}/dashboard/premium" style="display:block;text-align:center;background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:#fff;text-decoration:none;padding:12px 10px;border-radius:8px;font-weight:700;font-size:13px;">
                  ✨ Explore Premium Services
                </a>
              </td>
            </tr>
          </table>
        </div>
        ${FOOTER('You received this email because you applied for a job on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendProjectRejectedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const editUrl = `${BASE_URL}/dashboard`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Action needed on your project "${projectTitle}"`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">Your project needs some changes</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            Your project <strong>"${projectTitle}"</strong> wasn't approved at this time. Please review the feedback below, update your project, and resubmit.
          </p>
          ${adminNote ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#991B1B;"><strong>Admin note:</strong> ${adminNote}</p>
          </div>` : `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#991B1B;">Please ensure your project has a working live URL, clear description, and appropriate content.</p>
          </div>`}
          <a href="${editUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            Edit and resubmit →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            Once you've made the changes, you can resubmit for review from your dashboard.
          </p>
        </div>
        ${FOOTER('You received this email because you submitted a project on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendResumeReadyEmail = async ({ to, name, serviceLabel, completionLink, coverLetterLink }) => {
  const buttons = coverLetterLink
    ? `
      <a href="${completionLink}" target="_blank" style="display:inline-block;background:#0A7373;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:4px 6px;">
        Download Resume
      </a>
      <a href="${coverLetterLink}" target="_blank" style="display:inline-block;background:#0A7373;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:4px 6px;">
        Download Cover Letter
      </a>`
    : `
      <a href="${completionLink}" target="_blank" style="display:inline-block;background:#0A7373;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
        Download Documents
      </a>`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Your ${serviceLabel} is ready — Download Now`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1A1A1A;">Your documents are ready!</h2>
          <p style="color:#374151;margin:0 0 20px;font-size:14px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 24px;font-size:14px;">
            Great news! Your <strong>${serviceLabel}</strong> has been completed. Your documents are ready to download:
          </p>
          <div style="background:#F0FAF9;border:1.5px solid #0C8C8C;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 14px;font-size:13px;color:#0A5F5F;font-weight:600;">Click below to access your documents</p>
            ${buttons}
          </div>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            If you have any questions or need revisions, please reply to this email.
          </p>
        </div>
        ${FOOTER('You received this email because you requested a premium service on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendSessionScheduledEmail = async ({ to, name, serviceLabel, meetLink, scheduledAt }) => {
  const scheduledStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
    : null;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Your session is scheduled — ${serviceLabel}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1A1A1A;">Your session is confirmed!</h2>
          <p style="color:#374151;margin:0 0 20px;font-size:14px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 20px;font-size:14px;">
            Your <strong>${serviceLabel}</strong> session has been scheduled. Here are your meeting details:
          </p>
          ${scheduledStr ? `
          <div style="background:#F0FAF9;border:1px solid #A7F3D0;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0;font-size:13px;color:#0A5F5F;"><strong>Date &amp; Time:</strong> ${scheduledStr}</p>
          </div>` : ''}
          <div style="background:#F0FAF9;border:1.5px solid #0C8C8C;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 14px;font-size:13px;color:#0A5F5F;font-weight:600;">Join via Google Meet</p>
            <a href="${meetLink}" target="_blank" style="display:inline-block;background:#0A7373;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
              Join Meeting
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            Please join on time. If you have any questions, reply to this email.
          </p>
        </div>
        ${FOOTER('You received this email because you requested a premium session on ShareMyApps.')}
      </div>
    `,
  });
};
