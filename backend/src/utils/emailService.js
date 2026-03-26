const nodemailer = require('nodemailer');

/** Escape HTML special characters to prevent markup injection in email bodies. */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const FROM = process.env.SMTP_FROM || 'no-reply@assistanceplatform.org';

let transporter;
if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function send({ to, subject, html, text }) {
  if (!EMAIL_ENABLED) return;
  try {
    await transporter.sendMail({ from: FROM, to, subject, html, text });
  } catch (err) {
    // Log but don't crash — email is non-critical
    console.error('[email] Failed to send:', err.message);
  }
}

// ── Template helpers ────────────────────────────────────────────────────────

function statusLabel(status) {
  const labels = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    COMPLIANCE_REVIEW: 'Compliance Review',
    PENDING_DECISION: 'Pending Decision',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING_INFO: 'Additional Information Required',
    DISBURSEMENT: 'Disbursement in Progress',
    COMPLETED: 'Completed',
  };
  return labels[status] || status;
}

function wrap(body) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      <div style="background:#1e40af;padding:16px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;color:#fff;font-size:18px">AAA Assistance Platform</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        ${body}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af;margin:0">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// ── Email senders ────────────────────────────────────────────────────────────

async function sendApplicationReceived(app) {
  await send({
    to: app.email,
    subject: `Application Received — ${app.referenceNumber}`,
    html: wrap(`
      <p>Dear ${escapeHtml(app.firstName)},</p>
      <p>Thank you for submitting your assistance application. We have received it and a case manager will be assigned shortly.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;color:#1d4ed8">Your Reference Number</p>
        <p style="margin:0;font-size:24px;font-weight:bold;font-family:monospace;color:#1e3a8a">${escapeHtml(app.referenceNumber)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#3b82f6">Save this number — you can use it to check your application status.</p>
      </div>
      <p>You may be contacted if additional information is needed. We appreciate your patience.</p>
    `),
    text: `Dear ${app.firstName},\n\nThank you for submitting your assistance application. Your reference number is ${app.referenceNumber}.\n\nA case manager will be assigned shortly.`,
  });
}

async function sendStatusUpdated(app, newStatus) {
  const label = statusLabel(newStatus);
  const messages = {
    UNDER_REVIEW: 'A case manager has been assigned and is reviewing your application.',
    COMPLIANCE_REVIEW: 'Your application has moved to compliance review.',
    PENDING_DECISION: 'Your application is awaiting a final decision.',
    PENDING_INFO: 'Additional information is needed. A case manager will be in touch with details.',
    DISBURSEMENT: 'Your application has been approved and a disbursement is being processed.',
    COMPLETED: 'Your assistance has been fully processed. This case is now closed.',
  };
  const message = messages[newStatus] || `Your application status has been updated.`;

  await send({
    to: app.email,
    subject: `Application Update — ${app.referenceNumber}`,
    html: wrap(`
      <p>Dear ${escapeHtml(app.firstName)},</p>
      <p>Your application <strong>${escapeHtml(app.referenceNumber)}</strong> has a status update.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;color:#15803d">New Status</p>
        <p style="margin:0;font-size:18px;font-weight:bold;color:#14532d">${escapeHtml(label)}</p>
      </div>
      <p>${escapeHtml(message)}</p>
    `),
    text: `Dear ${app.firstName},\n\nYour application ${app.referenceNumber} status has been updated to: ${label}.\n\n${message}`,
  });
}

async function sendDecision(app, decision) {
  const configs = {
    APPROVED: {
      subject: `Application Approved — ${app.referenceNumber}`,
      headline: 'Your Application Has Been Approved',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      body: `
        <p>We are pleased to inform you that your assistance application has been <strong>approved</strong>.</p>
        ${decision.approvedAmount ? `<p>Approved amount: <strong>$${Number(decision.approvedAmount).toFixed(2)}</strong></p>` : ''}
        <p>A disbursement will be processed by our treasurer. You will receive another notification when your payment is scheduled.</p>
      `,
    },
    REJECTED: {
      subject: `Application Decision — ${app.referenceNumber}`,
      headline: 'Application Not Approved',
      color: '#b91c1c',
      bg: '#fef2f2',
      border: '#fecaca',
      body: `
        <p>After careful review, we were unable to approve your assistance application at this time.</p>
        <p><strong>Reason:</strong> ${escapeHtml(decision.rationale)}</p>
        <p>If you have questions or believe this decision was made in error, please contact us.</p>
      `,
    },
    PENDING_INFO: {
      subject: `Additional Information Required — ${app.referenceNumber}`,
      headline: 'Additional Information Needed',
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fde68a',
      body: `
        <p>Our review team requires additional information before a decision can be made on your application.</p>
        <p><strong>Details:</strong> ${escapeHtml(decision.rationale)}</p>
        <p>A case manager will contact you with further instructions.</p>
      `,
    },
  };

  const cfg = configs[decision.outcome];
  if (!cfg) return;

  await send({
    to: app.email,
    subject: cfg.subject,
    html: wrap(`
      <p>Dear ${escapeHtml(app.firstName)},</p>
      <div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:18px;font-weight:bold;color:${cfg.color}">${escapeHtml(cfg.headline)}</p>
      </div>
      ${cfg.body}
      <p style="font-size:12px;color:#6b7280">Reference: ${escapeHtml(app.referenceNumber)}</p>
    `),
    text: `Dear ${app.firstName},\n\n${cfg.headline}\n\nApplication: ${app.referenceNumber}\n\n${decision.rationale || ''}`,
  });
}

async function sendDisbursementScheduled(app, disbursement) {
  const date = new Date(disbursement.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  await send({
    to: app.email,
    subject: `Payment Scheduled — ${app.referenceNumber}`,
    html: wrap(`
      <p>Dear ${escapeHtml(app.firstName)},</p>
      <p>A payment has been scheduled for your approved assistance application.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><span style="color:#6b7280;font-size:12px">Amount</span><br/><strong style="font-size:20px">$${Number(disbursement.amount).toFixed(2)}</strong></p>
        <p style="margin:0 0 8px"><span style="color:#6b7280;font-size:12px">Method</span><br/><strong>${escapeHtml(disbursement.method)}</strong></p>
        <p style="margin:0"><span style="color:#6b7280;font-size:12px">Scheduled Date</span><br/><strong>${escapeHtml(date)}</strong></p>
      </div>
      <p>If you have questions about your payment, please contact us with your reference number: <strong>${escapeHtml(app.referenceNumber)}</strong>.</p>
    `),
    text: `Dear ${app.firstName},\n\nA payment of $${Number(disbursement.amount).toFixed(2)} has been scheduled for ${date} via ${disbursement.method}.\n\nReference: ${app.referenceNumber}`,
  });
}

async function sendDisbursementPaid(app, disbursement) {
  const date = new Date(disbursement.paidDate || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  await send({
    to: app.email,
    subject: `Payment Sent — ${app.referenceNumber}`,
    html: wrap(`
      <p>Dear ${escapeHtml(app.firstName)},</p>
      <p>Your assistance payment has been sent. Please allow time for processing depending on your payment method.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><span style="color:#6b7280;font-size:12px">Amount Sent</span><br/><strong style="font-size:20px">$${Number(disbursement.amount).toFixed(2)}</strong></p>
        <p style="margin:0 0 8px"><span style="color:#6b7280;font-size:12px">Method</span><br/><strong>${escapeHtml(disbursement.method)}</strong></p>
        <p style="margin:0"><span style="color:#6b7280;font-size:12px">Date Sent</span><br/><strong>${escapeHtml(date)}</strong></p>
      </div>
      <p>Your case is now marked as <strong>Completed</strong>. Thank you for allowing us to assist you.</p>
    `),
    text: `Dear ${app.firstName},\n\nYour payment of $${Number(disbursement.amount).toFixed(2)} has been sent on ${date} via ${disbursement.method}.\n\nReference: ${app.referenceNumber}`,
  });
}

async function sendCaseAssigned(caseManager, app) {
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${appUrl}/dashboard/cases/${app.id}`;
  await send({
    to: caseManager.email,
    subject: `New Case Assigned — ${app.referenceNumber}`,
    html: wrap(`
      <p>Hi ${escapeHtml(caseManager.firstName)},</p>
      <p>A new assistance application has been assigned to you.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;color:#1d4ed8">Reference Number</p>
        <p style="margin:0 0 12px;font-size:20px;font-weight:bold;font-family:monospace;color:#1e3a8a">${escapeHtml(app.referenceNumber)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#1d4ed8">Applicant</p>
        <p style="margin:0 0 12px;font-weight:bold">${escapeHtml(app.firstName)} ${escapeHtml(app.lastName)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#1d4ed8">Assistance Type</p>
        <p style="margin:0 0 12px">${escapeHtml(app.assistanceType || 'Not specified')}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#1d4ed8">Requested Amount</p>
        <p style="margin:0">$${app.requestedAmount ? Number(app.requestedAmount).toFixed(2) : '—'}</p>
      </div>
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#1e40af;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">View Application</a>
    `),
    text: `Hi ${caseManager.firstName},\n\nA new application has been assigned to you.\n\nReference: ${app.referenceNumber}\nApplicant: ${app.firstName} ${app.lastName}\n\nView it here: ${link}`,
  });
}

module.exports = {
  sendApplicationReceived,
  sendStatusUpdated,
  sendDecision,
  sendDisbursementScheduled,
  sendDisbursementPaid,
  sendCaseAssigned,
};
