#!/bin/bash
BASE="http://localhost:3000/api"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1 -- $2"; }
check() {
  local label=$1; local resp=$2; local expect=$3
  if echo "$resp" | grep -q "$expect"; then pass "$label"; else fail "$label" "$resp"; fi
}

# Login once per role
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"Admin123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CM_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"cm@example.com\",\"password\":\"CaseManager123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
COMP_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"compliance@example.com\",\"password\":\"Compliance123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
PRES_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"president@example.com\",\"password\":\"President123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
TREAS_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"treasurer@example.com\",\"password\":\"Treasurer123!\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

[ -n "$ADMIN_TOKEN" ] && pass "Admin login" || fail "Admin login" "empty token"
[ -n "$CM_TOKEN" ] && pass "CM login" || fail "CM login" "empty token"
[ -n "$COMP_TOKEN" ] && pass "Compliance login" || fail "Compliance login" "empty token"
[ -n "$PRES_TOKEN" ] && pass "President login" || fail "President login" "empty token"
[ -n "$TREAS_TOKEN" ] && pass "Treasurer login" || fail "Treasurer login" "empty token"

ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $ADMIN_TOKEN")
check "/me returns user" "$ME" "admin@example.com"

BAD=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"wrong\"}")
check "Wrong password rejected" "$BAD" "error"

CM_ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $CM_TOKEN")
CM_ID=$(echo $CM_ME | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
[ -n "$CM_ID" ] && pass "Got CM user id" || fail "Got CM user id" "empty: $CM_ME"

APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"Applicant\",\"email\":\"testapp_e2e@example.com\",\"phone\":\"555-0100\",\"address\":\"123 Main St\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80201\",\"householdSize\":3,\"monthlyIncome\":1200,\"employmentStatus\":\"UNEMPLOYED\",\"hardshipDescription\":\"Lost job due to medical emergency behind on rent\",\"assistanceType\":\"RENT\",\"requestedAmount\":1500,\"assistanceDetails\":\"Need help with 2 months back rent\"}")
check "Intake form submission" "$APP" "referenceNumber"
APP_ID=$(echo $APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$APP_ID" ] && pass "Got application id" || fail "Got application id" "empty"

LIST=$(curl -s "$BASE/applications" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can list applications" "$LIST" "referenceNumber"

SINGLE=$(curl -s "$BASE/applications/$APP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Get single application" "$SINGLE" "SUBMITTED"

CM_LIST=$(curl -s "$BASE/applications" -H "Authorization: Bearer $CM_TOKEN")
check "CM can list applications" "$CM_LIST" "referenceNumber"

ASSIGN=$(curl -s -X PATCH "$BASE/applications/$APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}")
check "Assign CM to application" "$ASSIGN" "assignedCaseManagerId"

R1=$(curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"UNDER_REVIEW\"}")
check "Advance to UNDER_REVIEW" "$R1" "UNDER_REVIEW"

SKIP=$(curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PENDING_DECISION\"}")
check "Invalid transition blocked" "$SKIP" "error"

NOTE=$(curl -s -X POST "$BASE/applications/$APP_ID/notes" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"content\":\"Contacted applicant verified employment status\"}")
check "Add note" "$NOTE" "content"

NOTES=$(curl -s "$BASE/applications/$APP_ID/notes" -H "Authorization: Bearer $CM_TOKEN")
check "Get notes" "$NOTES" "content"

R2=$(curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"COMPLIANCE_REVIEW\"}")
check "Advance to COMPLIANCE_REVIEW" "$R2" "COMPLIANCE_REVIEW"

COMP=$(curl -s -X PATCH "$BASE/applications/$APP_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"checklistData\":{\"id_verified\":true,\"income_verified\":true,\"address_verified\":true,\"hardship_documented\":true,\"amount_reasonable\":true,\"no_duplicate\":true,\"consent_signed\":true,\"documents_complete\":true}}")
check "Submit compliance checklist" "$COMP" "complianceChecklistData"

R3=$(curl -s -X PATCH "$BASE/applications/$APP_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PENDING_DECISION\"}")
check "Advance to PENDING_DECISION" "$R3" "PENDING_DECISION"

DEC=$(curl -s -X POST "$BASE/applications/$APP_ID/decisions" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d "{\"outcome\":\"APPROVED\",\"rationale\":\"Application meets all criteria\"}")
check "President APPROVE decision" "$DEC" "APPROVED"

APP_STATE=$(curl -s "$BASE/applications/$APP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "App status is APPROVED" "$APP_STATE" "APPROVED"

DISB=$(curl -s -X POST "$BASE/applications/$APP_ID/disbursements" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"amount\":1500,\"method\":\"CHECK\",\"scheduledDate\":\"2026-04-01T00:00:00.000Z\",\"notes\":\"Check mailed\"}")
check "Schedule disbursement" "$DISB" "SCHEDULED"
DISB_ID=$(echo $DISB | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$DISB_ID" ] && pass "Got disbursement id" || fail "Got disbursement id" "empty: $DISB"

PAID=$(curl -s -X PATCH "$BASE/disbursements/$DISB_ID" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"PAID\",\"paidDate\":\"2026-04-01T00:00:00.000Z\"}")
check "Mark disbursement PAID" "$PAID" "PAID"

APP_FINAL=$(curl -s "$BASE/applications/$APP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "App status COMPLETED after paid" "$APP_FINAL" "COMPLETED"

DON=$(curl -s -X POST "$BASE/donations" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d "{\"donorName\":\"Community Fund\",\"amount\":5000,\"method\":\"CHECK\",\"receivedDate\":\"2026-03-27T00:00:00.000Z\"}")
check "Create donation" "$DON" "donorName"

DON_LIST=$(curl -s "$BASE/donations" -H "Authorization: Bearer $TREAS_TOKEN")
check "List donations" "$DON_LIST" "donorName"

SUMMARY=$(curl -s "$BASE/reports/summary" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Reports summary" "$SUMMARY" "total"

RECON=$(curl -s "$BASE/reports/reconciliation" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Reconciliation report" "$RECON" "."

APP_REPORT=$(curl -s "$BASE/reports/applications" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Applications report" "$APP_REPORT" "."

USERS=$(curl -s "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can list users" "$USERS" "email"

CM_USERS=$(curl -s "$BASE/users" -H "Authorization: Bearer $CM_TOKEN")
check "CM cannot list users" "$CM_USERS" "error"

APP2=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d "{\"firstName\":\"Other\",\"lastName\":\"Person\",\"email\":\"other_e2e@example.com\",\"phone\":\"555-0200\",\"address\":\"456 Oak Ave\",\"city\":\"Denver\",\"state\":\"CO\",\"zip\":\"80202\",\"householdSize\":1,\"monthlyIncome\":800,\"employmentStatus\":\"PART_TIME\",\"hardshipDescription\":\"Cannot pay utilities\",\"assistanceType\":\"UTILITIES\",\"requestedAmount\":300,\"assistanceDetails\":\"Electric bill overdue\"}")
APP2_ID=$(echo $APP2 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
UNAUTH=$(curl -s -X PATCH "$BASE/applications/$APP2_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"UNDER_REVIEW\"}")
check "CM blocked from unassigned application" "$UNAUTH" "error"

echo ""
echo "=== TEST RUN COMPLETE ==="
