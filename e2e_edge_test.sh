#!/bin/bash
BASE="http://localhost:3000/api"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1 -- $2"; }
check() {
  local label=$1; local resp=$2; local expect=$3
  if echo "$resp" | grep -q "$expect"; then pass "$label"; else fail "$label" "$resp"; fi
}

ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"Admin123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CM_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"cm@example.com\",\"password\":\"CaseManager123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
COMP_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"compliance@example.com\",\"password\":\"Compliance123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
PRES_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"president@example.com\",\"password\":\"President123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
TREAS_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"treasurer@example.com\",\"password\":\"Treasurer123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

CM_ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $CM_TOKEN")
CM_ID=$(echo $CM_ME | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "=== EDGE CASES ==="

# Intake: missing required field
MISSING=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"email\":\"missing@example.com\"}")
check "Intake rejects missing fields" "$MISSING" "error"

# Intake: invalid email
BADEMAIL=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"notanemail\",\"phone\":\"555-0100\",\"address\":\"123 St\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80201\",\"householdSize\":2,\"monthlyIncome\":1000,\"employmentStatus\":\"UNEMPLOYED\",\"hardshipDescription\":\"Test hardship description here\",\"assistanceType\":\"RENT\",\"requestedAmount\":500,\"assistanceDetails\":\"Help needed\"}")
check "Intake rejects invalid email" "$BADEMAIL" "error"

# Get nonexistent application
NOTFOUND=$(curl -s "$BASE/applications/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Nonexistent application returns error" "$NOTFOUND" "error"

# No auth token
NOAUTH=$(curl -s "$BASE/applications" )
check "No auth token rejected" "$NOAUTH" "error"

# Submit and run through REJECTION flow
APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Reject\",\"lastName\":\"Test\",\"email\":\"reject_e2e@example.com\",\"phone\":\"555-0300\",\"address\":\"789 Test Rd\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80203\",\"householdSize\":1,\"monthlyIncome\":5000,\"employmentStatus\":\"FULL_TIME\",\"hardshipDescription\":\"Testing rejection flow end to end\",\"assistanceType\":\"FOOD\",\"requestedAmount\":200,\"assistanceDetails\":\"Food assistance needed\"}")
APP_ID=$(echo $APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "Submit rejection test application" "$APP" "referenceNumber"

curl -s -X PATCH "$BASE/applications/$APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"UNDER_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"COMPLIANCE_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"checklistData\":{\"id_verified\":true,\"income_verified\":true,\"address_verified\":true,\"hardship_documented\":true,\"amount_reasonable\":true,\"no_duplicate\":true,\"consent_signed\":true,\"documents_complete\":true}}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PENDING_DECISION\"}" > /dev/null

REJECT=$(curl -s -X POST "$BASE/applications/$APP_ID/decisions" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d "{\"outcome\":\"REJECTED\",\"rationale\":\"Income exceeds threshold\"}")
check "President REJECT decision" "$REJECT" "REJECTED"

APP_REJ=$(curl -s "$BASE/applications/$APP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "App status is REJECTED" "$APP_REJ" "REJECTED"

# Cannot disburse a rejected application
DISB_FAIL=$(curl -s -X POST "$BASE/applications/$APP_ID/disbursements" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"amount\":200,\"method\":\"CHECK\",\"scheduledDate\":\"2026-04-01T00:00:00.000Z\"}")
check "Cannot disburse rejected application" "$DISB_FAIL" "error"

# PENDING_INFO flow
APP2=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Info\",\"lastName\":\"Needed\",\"email\":\"pendinginfo_e2e@example.com\",\"phone\":\"555-0400\",\"address\":\"101 Info Ave\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80204\",\"householdSize\":2,\"monthlyIncome\":900,\"employmentStatus\":\"PART_TIME\",\"hardshipDescription\":\"Need more information for this test\",\"assistanceType\":\"UTILITIES\",\"requestedAmount\":250,\"assistanceDetails\":\"Utility bills\"}")
APP2_ID=$(echo $APP2 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -X PATCH "$BASE/applications/$APP2_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP2_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"UNDER_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP2_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"COMPLIANCE_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP2_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"checklistData\":{\"id_verified\":true,\"income_verified\":false,\"address_verified\":true,\"hardship_documented\":true,\"amount_reasonable\":true,\"no_duplicate\":true,\"consent_signed\":true,\"documents_complete\":false}}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP2_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PENDING_DECISION\"}" > /dev/null

PENDING_INFO=$(curl -s -X POST "$BASE/applications/$APP2_ID/decisions" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d "{\"outcome\":\"PENDING_INFO\",\"rationale\":\"Need proof of income\"}")
check "President REQUEST_INFO decision" "$PENDING_INFO" "PENDING_INFO"

APP2_STATE=$(curl -s "$BASE/applications/$APP2_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "App status is PENDING_INFO" "$APP2_STATE" "PENDING_INFO"

# Role enforcement: CM cannot approve
APP3=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Role\",\"lastName\":\"Test\",\"email\":\"roletest_e2e@example.com\",\"phone\":\"555-0500\",\"address\":\"202 Role St\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80205\",\"householdSize\":1,\"monthlyIncome\":600,\"employmentStatus\":\"UNEMPLOYED\",\"hardshipDescription\":\"Testing role enforcement on decision endpoint\",\"assistanceType\":\"FOOD\",\"requestedAmount\":100,\"assistanceDetails\":\"Food\"}")
APP3_ID=$(echo $APP3 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -X PATCH "$BASE/applications/$APP3_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP3_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"UNDER_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP3_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"COMPLIANCE_REVIEW\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP3_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"checklistData\":{\"id_verified\":true,\"income_verified\":true,\"address_verified\":true,\"hardship_documented\":true,\"amount_reasonable\":true,\"no_duplicate\":true,\"consent_signed\":true,\"documents_complete\":true}}" > /dev/null
curl -s -X PATCH "$BASE/applications/$APP3_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PENDING_DECISION\"}" > /dev/null

CM_APPROVE=$(curl -s -X POST "$BASE/applications/$APP3_ID/decisions" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"outcome\":\"APPROVED\",\"rationale\":\"Test\"}")
check "CM cannot make approval decision" "$CM_APPROVE" "error"

TREAS_APPROVE=$(curl -s -X POST "$BASE/applications/$APP3_ID/decisions" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"outcome\":\"APPROVED\",\"rationale\":\"Test\"}")
check "Treasurer cannot make approval decision" "$TREAS_APPROVE" "error"

# Treasurer cannot advance application status
TREAS_STATUS=$(curl -s -X PATCH "$BASE/applications/$APP3_ID/status" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\"}")
check "Treasurer cannot advance status" "$TREAS_STATUS" "error"

# Donation: invalid method
BAD_DON=$(curl -s -X POST "$BASE/donations" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"donorName\":\"Test\",\"amount\":100,\"method\":\"BITCOIN\",\"receivedDate\":\"2026-03-27T00:00:00.000Z\"}")
check "Donation rejects invalid method" "$BAD_DON" "error"

# Donation: missing amount
NO_AMT=$(curl -s -X POST "$BASE/donations" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"donorName\":\"Test\",\"method\":\"CASH\",\"receivedDate\":\"2026-03-27T00:00:00.000Z\"}")
check "Donation rejects missing amount" "$NO_AMT" "error"

# Disbursement on nonexistent application
DISB_NOTFOUND=$(curl -s -X POST "$BASE/applications/00000000-0000-0000-0000-000000000000/disbursements" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"amount\":100,\"method\":\"CHECK\",\"scheduledDate\":\"2026-04-01T00:00:00.000Z\"}")
check "Disbursement on nonexistent app returns error" "$DISB_NOTFOUND" "error"

# User management: admin can create user
NEW_USER=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"newcm_e2e@example.com\",\"password\":\"NewCM123!\",\"firstName\":\"New\",\"lastName\":\"CaseManager\",\"role\":\"CASE_MANAGER\"}")
check "Admin can create user" "$NEW_USER" "email"

# CM cannot create user
CM_CREATE=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"cantcreate@example.com\",\"password\":\"Test123!\",\"firstName\":\"No\",\"lastName\":\"Access\",\"role\":\"CASE_MANAGER\"}")
check "CM cannot create user" "$CM_CREATE" "error"

echo ""
echo "=== EDGE CASE TEST COMPLETE ==="
