async function sendApplicationReceived(app) {}
async function sendStatusUpdated(app, newStatus) {}
async function sendDecision(app, decision) {}
async function sendDisbursementScheduled(app, disbursement) {}
async function sendDisbursementPaid(app, disbursement) {}
async function sendCaseAssigned(caseManager, app) {}
async function sendEmailVerification(user, verificationUrl) {}

module.exports = {
  sendApplicationReceived,
  sendStatusUpdated,
  sendDecision,
  sendDisbursementScheduled,
  sendDisbursementPaid,
  sendCaseAssigned,
  sendEmailVerification,
};
