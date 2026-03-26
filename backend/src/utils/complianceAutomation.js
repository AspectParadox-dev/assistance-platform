const prisma = require('./prismaClient');

/**
 * Evaluate compliance checklist items automatically based on application data.
 * Returns { suggestions, reasons } — neither is authoritative; the compliance officer
 * reviews and saves manually.
 *
 * Rules per checklist key:
 *  id_verified              → always false  (requires physical ID review)
 *  income_documented        → monthlyIncome > 0 AND at least one document uploaded
 *  hardship_confirmed       → hardshipDescription is at least 50 chars
 *  residence_verified       → all address fields are non-empty
 *  household_verified       → householdSize >= 1
 *  assistance_type_appropriate → assistanceType non-empty AND requestedAmount > 0
 *  amount_reasonable        → requestedAmount <= MAX_REASONABLE_AMOUNT (env, default $10,000)
 *  no_duplicate             → no other active (non-rejected/completed) application for same email
 */
async function evaluate(applicationId) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { documents: true },
  });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

  const MAX_AMOUNT = Number(process.env.MAX_REASONABLE_AMOUNT) || 10000;

  const suggestions = {};
  const reasons = {};

  // 1. id_verified — always requires human review
  suggestions.id_verified = false;
  reasons.id_verified = 'Government ID must be manually reviewed by a compliance officer.';

  // 2. income_documented — income value present AND at least one supporting document uploaded
  const hasIncome = app.monthlyIncome > 0;
  const hasDocs = app.documents.length > 0;
  suggestions.income_documented = hasIncome && hasDocs;
  reasons.income_documented = !hasIncome
    ? 'No monthly income value provided.'
    : !hasDocs
    ? 'No supporting documents have been uploaded.'
    : `Monthly income of $${app.monthlyIncome.toFixed(2)} reported and ${app.documents.length} document(s) on file.`;

  // 3. hardship_confirmed — description is substantive (>= 50 chars)
  const descLen = (app.hardshipDescription || '').trim().length;
  suggestions.hardship_confirmed = descLen >= 50;
  reasons.hardship_confirmed = descLen >= 50
    ? `Hardship description is ${descLen} characters (sufficient detail).`
    : `Hardship description is only ${descLen} characters — too brief to confirm.`;

  // 4. residence_verified — all address fields present
  const addrFields = [app.address, app.city, app.state, app.zip];
  const allAddrPresent = addrFields.every((f) => f && f.trim().length > 0);
  suggestions.residence_verified = allAddrPresent;
  reasons.residence_verified = allAddrPresent
    ? `Full address on file: ${app.address}, ${app.city}, ${app.state} ${app.zip}.`
    : 'One or more address fields are missing.';

  // 5. household_verified — household size is a positive integer
  const validHousehold = Number.isInteger(app.householdSize) && app.householdSize >= 1;
  suggestions.household_verified = validHousehold;
  reasons.household_verified = validHousehold
    ? `Household size of ${app.householdSize} reported.`
    : 'Invalid household size value.';

  // 6. assistance_type_appropriate — type and amount both present
  const hasType = app.assistanceType && app.assistanceType.trim().length > 0;
  const hasAmount = app.requestedAmount > 0;
  suggestions.assistance_type_appropriate = hasType && hasAmount;
  reasons.assistance_type_appropriate = hasType && hasAmount
    ? `Assistance type "${app.assistanceType}" with requested amount $${app.requestedAmount.toFixed(2)}.`
    : 'Assistance type or requested amount is missing.';

  // 7. amount_reasonable — requested amount within configured ceiling
  suggestions.amount_reasonable = app.requestedAmount > 0 && app.requestedAmount <= MAX_AMOUNT;
  reasons.amount_reasonable = app.requestedAmount <= 0
    ? 'Requested amount must be greater than zero.'
    : app.requestedAmount <= MAX_AMOUNT
    ? `Requested $${app.requestedAmount.toFixed(2)} is within the $${MAX_AMOUNT.toLocaleString()} ceiling.`
    : `Requested $${app.requestedAmount.toFixed(2)} exceeds the $${MAX_AMOUNT.toLocaleString()} ceiling — manual review required.`;

  // 8. no_duplicate — no other active application for the same email
  const duplicate = await prisma.application.findFirst({
    where: {
      email: app.email,
      id: { not: applicationId },
      status: { notIn: ['REJECTED', 'COMPLETED'] },
    },
  });
  suggestions.no_duplicate = !duplicate;
  reasons.no_duplicate = duplicate
    ? `Another active application (${duplicate.referenceNumber}) exists for ${app.email}.`
    : `No other active applications found for ${app.email}.`;

  return { suggestions, reasons };
}

module.exports = { evaluate };
