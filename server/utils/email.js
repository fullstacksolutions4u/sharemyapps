const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // force IPv4 — Render free tier can't reach Gmail over IPv6
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

exports.sendProjectApprovedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const projectUrl = `${BASE_URL}/project/${projectId}`;

  await transporter.sendMail({
    from: `"ShareMyApps" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your project "${projectTitle}" is now live!`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="https://sharemyapps.vercel.app/logo.png" alt="ShareMyApps" style="height:40px;object-fit:contain;" />
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
            Share your portfolio link with recruiters and clients to showcase all your work in one place.
          </p>
        </div>
        <div style="background:#F3F0EB;padding:16px 32px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">You received this email because you submitted a project on ShareMyApps.</p>
        </div>
      </div>
    `,
  });
};

exports.sendProjectRejectedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const editUrl = `${BASE_URL}/dashboard`;

  await transporter.sendMail({
    from: `"ShareMyApps" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Action needed on your project "${projectTitle}"`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="https://sharemyapps.vercel.app/logo.png" alt="ShareMyApps" style="height:40px;object-fit:contain;" />
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
        <div style="background:#F3F0EB;padding:16px 32px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">You received this email because you submitted a project on ShareMyApps.</p>
        </div>
      </div>
    `,
  });
};
