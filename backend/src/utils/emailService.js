const https = require('https');

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLIANCE_REVIEW: 'Compliance Review',
  PENDING_DECISION: 'Pending Decision',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING_INFO: 'Additional Information Required',
  DISBURSEMENT: 'Disbursement Scheduled',
  COMPLETED: 'Completed',
};

function send({ to, toName, subject, html }) {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  if (!apiKey || !secretKey) {
    console.warn('[email] MAILJET_API_KEY / MAILJET_SECRET_KEY not set — skipping email to', to);
    return;
  }

  const body = JSON.stringify({
    Messages: [
      {
        From: {
          Email: process.env.EMAIL_FROM || 'arshanwari03@gmail.com',
          Name: process.env.EMAIL_FROM_NAME || 'Assistance Platform',
        },
        To: [{ Email: to, Name: toName || to }],
        Subject: subject,
        HTMLPart: html,
      },
    ],
  });

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  const req = https.request(
    {
      hostname: 'api.mailjet.com',
      path: '/v3.1/send',
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    (res) => {
      if (res.statusCode >= 400) {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => console.error('[email] Mailjet error', res.statusCode, data));
      }
    }
  );

  req.on('error', (err) => console.error('[email] send failed:', err.message));
  req.write(body);
  req.end();
}

// ─────────────────────────────────────────────────────────────────────────────

async function sendApplicationReceived(app) {
  send({
    to: app.email,
    toName: `${app.firstName} ${app.lastName}`,
    subject: `Application Received — Ref #${app.referenceNumber}`,
    html: `
      <p>Hi ${app.firstName},</p>
      <p>We received your application. Here is your reference number:</p>
      <p style="font-size:1.4em;font-weight:bold;letter-spacing:2px">${app.referenceNumber}</p>
      <p>Save this number — you'll need it to check your application status. A case manager will review your application and be in touch.</p>
      <p>Thank you,<br>The Assistance Team</p>
    `,
  });
}

async function sendStatusUpdated(app, newStatus) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  send({
    to: app.email,
    toName: `${app.firstName} ${app.lastName}`,
    subject: `Application Update — ${label}`,
    html: `
      <p>Hi ${app.firstName},</p>
      <p>Your application <strong>#${app.referenceNumber}</strong> has been updated.</p>
      <p><strong>New status:</strong> ${label}</p>
      <p>If you have questions, contact your case manager directly.</p>
      <p>Thank you,<br>The Assistance Team</p>
    `,
  });
}

async function sendDecision(app, decision) {
  const messages = {
    APPROVED: `
      <p>Great news — your application has been <strong>approved</strong>.</p>
      ${decision.approvedAmount ? `<p><strong>Approved amount:</strong> $${Number(decision.approvedAmount).toFixed(2)}</p>` : ''}
      <p>A disbursement will be scheduled and you will receive a follow-up email with the details.</p>
    `,
    REJECTED: `
      <p>We regret to inform you that your application has been <strong>declined</strong>.</p>
      ${decision.rationale ? `<p><strong>Reason:</strong> ${decision.rationale}</p>` : ''}
      <p>If you believe this decision was made in error, please contact us.</p>
    `,
    PENDING_INFO: `
      <p>Your application is on hold — we need <strong>additional information</strong> before we can proceed.</p>
      ${decision.rationale ? `<p><strong>Details:</strong> ${decision.rationale}</p>` : ''}
      <p>Please respond as soon as possible so we can continue reviewing your case.</p>
    `,
  };

  const subjects = {
    APPROVED: `Application Approved — Ref #${app.referenceNumber}`,
    REJECTED: `Application Decision — Ref #${app.referenceNumber}`,
    PENDING_INFO: `Action Required — Ref #${app.referenceNumber}`,
  };

  const body = messages[decision.outcome];
  if (!body) return;

  send({
    to: app.email,
    toName: `${app.firstName} ${app.lastName}`,
    subject: subjects[decision.outcome],
    html: `
      <p>Hi ${app.firstName},</p>
      ${body}
      <p>Thank you,<br>The Assistance Team</p>
    `,
  });
}

async function sendDisbursementScheduled(app, disbursement) {
  const date = new Date(disbursement.scheduledDate).toLocaleDateString('en-US', { dateStyle: 'long' });
  send({
    to: app.email,
    toName: `${app.firstName} ${app.lastName}`,
    subject: `Disbursement Scheduled — Ref #${app.referenceNumber}`,
    html: `
      <p>Hi ${app.firstName},</p>
      <p>A disbursement has been scheduled for your application.</p>
      <p><strong>Amount:</strong> $${Number(disbursement.amount).toFixed(2)}<br>
         <strong>Method:</strong> ${disbursement.method}<br>
         <strong>Scheduled date:</strong> ${date}</p>
      <p>Thank you,<br>The Assistance Team</p>
    `,
  });
}

async function sendDisbursementPaid(app, disbursement) {
  const date = new Date(disbursement.paidDate || disbursement.updatedAt).toLocaleDateString('en-US', { dateStyle: 'long' });
  send({
    to: app.email,
    toName: `${app.firstName} ${app.lastName}`,
    subject: `Disbursement Sent — Ref #${app.referenceNumber}`,
    html: `
      <p>Hi ${app.firstName},</p>
      <p>Your disbursement has been sent.</p>
      <p><strong>Amount:</strong> $${Number(disbursement.amount).toFixed(2)}<br>
         <strong>Method:</strong> ${disbursement.method}<br>
         <strong>Sent on:</strong> ${date}</p>
      <p>If you have not received your payment within a few business days, please contact us.</p>
      <p>Thank you,<br>The Assistance Team</p>
    `,
  });
}

async function sendCaseAssigned(caseManager, app) {
  send({
    to: caseManager.email,
    toName: `${caseManager.firstName} ${caseManager.lastName}`,
    subject: `New Application Assigned — Ref #${app.referenceNumber}`,
    html: `
      <p>Hi ${caseManager.firstName},</p>
      <p>You have been assigned to a new application.</p>
      <p><strong>Applicant:</strong> ${app.firstName} ${app.lastName}<br>
         <strong>Reference:</strong> #${app.referenceNumber}<br>
         <strong>Assistance type:</strong> ${app.assistanceType}<br>
         <strong>Requested amount:</strong> $${Number(app.requestedAmount).toFixed(2)}</p>
      <p>Log in to review the application and advance it through the workflow.</p>
      <p>Thank you,<br>The Assistance Platform</p>
    `,
  });
}

async function sendEmailVerification(user, verificationUrl) {
  send({
    to: user.email,
    toName: user.firstName,
    subject: 'Verify Your Email Address',
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Click the button below to verify your email address and activate your account.</p>
      <p style="margin:24px 0">
        <a href="${verificationUrl}"
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Verify Email Address
        </a>
      </p>
      <p>Or copy this link into your browser:<br>
         <a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours. If you did not create an account, ignore this email.</p>
      <p>Thank you,<br>The Assistance Platform</p>
    `,
  });
}

module.exports = {
  sendApplicationReceived,
  sendStatusUpdated,
  sendDecision,
  sendDisbursementScheduled,
  sendDisbursementPaid,
  sendCaseAssigned,
  sendEmailVerification,
};
