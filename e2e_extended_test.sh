#!/bin/bash
# Extended E2E tests — covers paths not in e2e_test.sh or e2e_edge_test.sh
BASE="http://localhost:3000/api"
PASS=0; FAIL=0

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 -- $2"; FAIL=$((FAIL+1)); }
check() {
  local label=$1; local resp=$2; local expect=$3
  if echo "$resp" | grep -q "$expect"; then pass "$label"; else fail "$label" "$resp"; fi
}
check_not() {
  local label=$1; local resp=$2; local bad=$3
  if echo "$resp" | grep -q "$bad"; then fail "$label" "should NOT contain '$bad': $resp"; else pass "$label"; fi
}

# ── Tokens ─────────────────────────────────────────────────────────────────────
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CM_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"cm@example.com","password":"CaseManager123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
COMP_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"compliance@example.com","password":"Compliance123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
PRES_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"president@example.com","password":"President123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
TREAS_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"treasurer@example.com","password":"Treasurer123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

CM_ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $CM_TOKEN")
CM_ID=$(echo $CM_ME | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

ADMIN_ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_ID=$(echo $ADMIN_ME | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "=== EXTENDED TESTS ==="
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "--- Auth Edge Cases ---"

# Tampered JWT
TAMPERED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlLWlkIiwicm9sZSI6IkFETUlOIn0.invalidsignature"
TAMPERED=$(curl -s "$BASE/applications" -H "Authorization: Bearer $TAMPERED_TOKEN")
check "Tampered JWT rejected" "$TAMPERED" "error"

# Malformed Authorization header (no Bearer prefix)
NOBEARER=$(curl -s "$BASE/applications" -H "Authorization: $ADMIN_TOKEN")
check "Missing Bearer prefix rejected" "$NOBEARER" "error"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- User Management ---"

# Create a user with unique email
SUFFIX=$(date +%s)
TEST_EMAIL="ext_cm_${SUFFIX}@example.com"
NEW_USER=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"ExtCM123!\",\"firstName\":\"Ext\",\"lastName\":\"CM\",\"role\":\"CASE_MANAGER\"}")
check "Admin creates test user" "$NEW_USER" "email"
NEW_USER_ID=$(echo $NEW_USER | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Admin updates user firstName
UPDATE_USER=$(curl -s -X PATCH "$BASE/users/$NEW_USER_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"firstName":"Updated"}')
check "Admin can update user firstName" "$UPDATE_USER" "Updated"

# Admin updates user role
UPDATE_ROLE=$(curl -s -X PATCH "$BASE/users/$NEW_USER_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"role":"COMPLIANCE_OFFICER"}')
check "Admin can update user role" "$UPDATE_ROLE" "COMPLIANCE_OFFICER"

# Update nonexistent user returns 404
BAD_UPDATE=$(curl -s -X PATCH "$BASE/users/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"firstName":"Ghost"}')
check "Update nonexistent user returns error" "$BAD_UPDATE" "error"

# President cannot create user (RBAC)
PRES_CREATE=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d '{"email":"pres_create@example.com","password":"Test123!","firstName":"X","lastName":"Y","role":"CASE_MANAGER"}')
check "President cannot create user" "$PRES_CREATE" "error"

# Treasurer cannot list users (RBAC)
TREAS_USERS=$(curl -s "$BASE/users" -H "Authorization: Bearer $TREAS_TOKEN")
check "Treasurer cannot list users" "$TREAS_USERS" "error"

# Admin cannot deactivate own account
SELF_DEACT=$(curl -s -X PATCH "$BASE/users/$ADMIN_ID/deactivate" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin cannot deactivate own account" "$SELF_DEACT" "error"

# Admin deactivates newly created user
DEACT=$(curl -s -X PATCH "$BASE/users/$NEW_USER_ID/deactivate" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can deactivate user" "$DEACT" "\"isActive\":false"

# Deactivated user cannot login
DEACT_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"ExtCM123!\"}")
check "Deactivated user cannot login" "$DEACT_LOGIN" "error"

# Deactivate nonexistent user returns 404
BAD_DEACT=$(curl -s -X PATCH "$BASE/users/00000000-0000-0000-0000-000000000000/deactivate" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Deactivate nonexistent user returns error" "$BAD_DEACT" "error"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Application Filtering & Pagination ---"

# Filter by status=SUBMITTED
FILTER_SUB=$(curl -s "$BASE/applications?status=SUBMITTED" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Filter applications by status=SUBMITTED" "$FILTER_SUB" "data"
check_not "Filter by SUBMITTED excludes UNDER_REVIEW" "$FILTER_SUB" "\"UNDER_REVIEW\""

# Pagination: page 1, limit 2
PAGE_RESP=$(curl -s "$BASE/applications?page=1&limit=2" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Pagination returns data and total" "$PAGE_RESP" "\"total\":"

# Invalid page (page=0) should still return results (server clamps to 1)
BAD_PAGE=$(curl -s "$BASE/applications?page=0&limit=5" -H "Authorization: Bearer $ADMIN_TOKEN")
check "page=0 clamped to 1 (no server error)" "$BAD_PAGE" "data"

# Negative page clamped (no server crash)
NEG_PAGE=$(curl -s "$BASE/applications?page=-5&limit=5" -H "Authorization: Bearer $ADMIN_TOKEN")
check "page=-5 clamped (no server error)" "$NEG_PAGE" "data"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Assignment Rules ---"

# Assign a nonexistent caseManager → 404
FRESH_APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d '{"firstName":"Assign","lastName":"Test","email":"assigntest_ext@example.com","phone":"555-0600","address":"1 Test Ln","city":"Denver","state":"CO","zip":"80200","householdSize":1,"monthlyIncome":800,"employmentStatus":"UNEMPLOYED","hardshipDescription":"Testing assignment edge cases here","assistanceType":"RENT","requestedAmount":300,"assistanceDetails":"Rent help"}')
FRESH_APP_ID=$(echo $FRESH_APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

ASSIGN_GHOST=$(curl -s -X PATCH "$BASE/applications/$FRESH_APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"caseManagerId":"00000000-0000-0000-0000-000000000000"}')
check "Assign nonexistent caseManager returns error" "$ASSIGN_GHOST" "error"

# Assign a non-case-manager role (Treasurer) → 400
TREAS_ME=$(curl -s $BASE/auth/me -H "Authorization: Bearer $TREAS_TOKEN")
TREAS_ID=$(echo $TREAS_ME | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
ASSIGN_TREAS=$(curl -s -X PATCH "$BASE/applications/$FRESH_APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$TREAS_ID\"}")
check "Assigning treasurer-role user returns error" "$ASSIGN_TREAS" "error"

# CM cannot assign other case managers (only ADMIN and CM roles allowed, but CM could assign to self?)
# Assign fresh app to CM via admin first so CM can access it, then try CM reassigning
curl -s -X PATCH "$BASE/applications/$FRESH_APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Compliance Officer Restrictions ---"

# Compliance cannot advance status from SUBMITTED (app not in COMPLIANCE_REVIEW)
COMP_ADVANCE_EARLY=$(curl -s -X PATCH "$BASE/applications/$FRESH_APP_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d '{"status":"COMPLIANCE_REVIEW"}')
check "Compliance cannot advance app not in COMPLIANCE_REVIEW" "$COMP_ADVANCE_EARLY" "error"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- PENDING_INFO Re-review Path ---"

# Full path: SUBMITTED → UNDER_REVIEW → COMPLIANCE_REVIEW → PENDING_DECISION
#            → PENDING_INFO → COMPLIANCE_REVIEW → PENDING_DECISION → APPROVED
#            → DISBURSEMENT → COMPLETED

REREV_APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d '{"firstName":"ReReview","lastName":"Test","email":"rereview_ext@example.com","phone":"555-0700","address":"2 Review Rd","city":"Denver","state":"CO","zip":"80200","householdSize":2,"monthlyIncome":700,"employmentStatus":"PART_TIME","hardshipDescription":"Testing the pending info re-review path end to end","assistanceType":"UTILITIES","requestedAmount":150,"assistanceDetails":"Utility help"}')
REREV_ID=$(echo $REREV_APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "PENDING_INFO path: intake submitted" "$REREV_APP" "referenceNumber"

curl -s -X PATCH "$BASE/applications/$REREV_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$REREV_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d '{"status":"UNDER_REVIEW"}' > /dev/null
curl -s -X PATCH "$BASE/applications/$REREV_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d '{"status":"COMPLIANCE_REVIEW"}' > /dev/null
curl -s -X PATCH "$BASE/applications/$REREV_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d '{"checklistData":{"id_verified":true,"income_verified":false,"address_verified":true,"hardship_documented":true,"amount_reasonable":true,"no_duplicate":true,"consent_signed":true,"documents_complete":false}}' > /dev/null
curl -s -X PATCH "$BASE/applications/$REREV_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d '{"status":"PENDING_DECISION"}' > /dev/null

# President requests more info
PEND_DEC=$(curl -s -X POST "$BASE/applications/$REREV_ID/decisions" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d '{"outcome":"PENDING_INFO","rationale":"Need additional income proof"}')
check "PENDING_INFO path: president requests info" "$PEND_DEC" "PENDING_INFO"

# Status machine: PENDING_INFO → COMPLIANCE_REVIEW (re-entry)
REENTER=$(curl -s -X PATCH "$BASE/applications/$REREV_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d '{"status":"COMPLIANCE_REVIEW"}')
check "PENDING_INFO path: re-enter compliance review" "$REENTER" "COMPLIANCE_REVIEW"

# PENDING_INFO → PENDING_DECISION (direct skip also valid per status machine)
# Re-run compliance and advance
curl -s -X PATCH "$BASE/applications/$REREV_ID/compliance" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d '{"checklistData":{"id_verified":true,"income_verified":true,"address_verified":true,"hardship_documented":true,"amount_reasonable":true,"no_duplicate":true,"consent_signed":true,"documents_complete":true}}' > /dev/null
curl -s -X PATCH "$BASE/applications/$REREV_ID/status" -H "Authorization: Bearer $COMP_TOKEN" -H "Content-Type: application/json" -d '{"status":"PENDING_DECISION"}' > /dev/null

APPROVE2=$(curl -s -X POST "$BASE/applications/$REREV_ID/decisions" -H "Authorization: Bearer $PRES_TOKEN" -H "Content-Type: application/json" -d '{"outcome":"APPROVED","rationale":"Income proof provided"}')
check "PENDING_INFO path: approved after re-review" "$APPROVE2" "APPROVED"

DISB2=$(curl -s -X POST "$BASE/applications/$REREV_ID/disbursements" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d '{"amount":150,"method":"CHECK","scheduledDate":"2026-04-15T00:00:00.000Z"}')
check "PENDING_INFO path: disbursement scheduled" "$DISB2" "SCHEDULED"
DISB2_ID=$(echo $DISB2 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Cannot schedule a second disbursement (app is now in DISBURSEMENT status, not APPROVED)
DOUBLE_DISB=$(curl -s -X POST "$BASE/applications/$REREV_ID/disbursements" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d '{"amount":50,"method":"CASH","scheduledDate":"2026-04-20T00:00:00.000Z"}')
check "Cannot schedule second disbursement on same application" "$DOUBLE_DISB" "error"

# Mark first disbursement PAID
PAID2=$(curl -s -X PATCH "$BASE/disbursements/$DISB2_ID" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d '{"status":"PAID"}')
check "PENDING_INFO path: disbursement marked PAID" "$PAID2" "PAID"

# Application is now COMPLETED
DONE=$(curl -s "$BASE/applications/$REREV_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "PENDING_INFO path: application COMPLETED" "$DONE" "COMPLETED"

# Cannot mark already-PAID disbursement as PAID again
REPAY=$(curl -s -X PATCH "$BASE/disbursements/$DISB2_ID" -H "Authorization: Bearer $TREAS_TOKEN" -H "Content-Type: application/json" -d '{"status":"PAID"}')
check "Cannot mark already-paid disbursement as PAID again" "$REPAY" "error"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Auto-Check Compliance ---"

AUTO_APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d '{"firstName":"Auto","lastName":"Check","email":"autocheck_ext@example.com","phone":"555-0800","address":"3 Auto Ave","city":"Denver","state":"CO","zip":"80200","householdSize":3,"monthlyIncome":600,"employmentStatus":"UNEMPLOYED","hardshipDescription":"Testing auto compliance check feature for the platform","assistanceType":"FOOD","requestedAmount":100,"assistanceDetails":"Food help"}')
AUTO_APP_ID=$(echo $AUTO_APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -X PATCH "$BASE/applications/$AUTO_APP_ID/assign" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"caseManagerId\":\"$CM_ID\"}" > /dev/null
curl -s -X PATCH "$BASE/applications/$AUTO_APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d '{"status":"UNDER_REVIEW"}' > /dev/null
curl -s -X PATCH "$BASE/applications/$AUTO_APP_ID/status" -H "Authorization: Bearer $CM_TOKEN" -H "Content-Type: application/json" -d '{"status":"COMPLIANCE_REVIEW"}' > /dev/null

AUTO_CHECK=$(curl -s "$BASE/applications/$AUTO_APP_ID/compliance/auto-check" -H "Authorization: Bearer $COMP_TOKEN")
check "Auto-check compliance returns suggestions" "$AUTO_CHECK" "suggestions"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Notes Edge Cases ---"

# Get notes on an application with no notes
NOTE_APP=$(curl -s -X POST $BASE/applications -H "Content-Type: application/json" -d '{"firstName":"Note","lastName":"Empty","email":"noteempty_ext@example.com","phone":"555-0900","address":"4 Note St","city":"Denver","state":"CO","zip":"80200","householdSize":1,"monthlyIncome":900,"employmentStatus":"FULL_TIME","hardshipDescription":"Testing empty notes list on a fresh application","assistanceType":"RENT","requestedAmount":200,"assistanceDetails":"Rent"}')
NOTE_APP_ID=$(echo $NOTE_APP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

EMPTY_NOTES=$(curl -s "$BASE/applications/$NOTE_APP_ID/notes" -H "Authorization: Bearer $ADMIN_TOKEN")
check_not "Empty notes list is not an error" "$EMPTY_NOTES" "error"

# Add multiple notes and verify all are returned
curl -s -X POST "$BASE/applications/$NOTE_APP_ID/notes" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"content":"First note for this application"}' > /dev/null
curl -s -X POST "$BASE/applications/$NOTE_APP_ID/notes" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"content":"Second note for this application"}' > /dev/null
MULTI_NOTES=$(curl -s "$BASE/applications/$NOTE_APP_ID/notes" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Multiple notes all returned" "$MULTI_NOTES" "Second note"

# Unauthenticated user cannot read notes
UNAUTH_NOTES=$(curl -s "$BASE/applications/$NOTE_APP_ID/notes")
check "Unauthenticated cannot read notes" "$UNAUTH_NOTES" "error"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "--- Disbursement Listing ---"

# Treasurer can list all disbursements
DISB_LIST=$(curl -s "$BASE/disbursements" -H "Authorization: Bearer $TREAS_TOKEN")
check "Treasurer can list disbursements" "$DISB_LIST" "data"

# Case manager cannot list disbursements (not in allowed roles)
CM_DISB=$(curl -s "$BASE/disbursements" -H "Authorization: Bearer $CM_TOKEN")
check "Case manager cannot list disbursements" "$CM_DISB" "error"

# President can list disbursements
PRES_DISB=$(curl -s "$BASE/disbursements" -H "Authorization: Bearer $PRES_TOKEN")
check "President can list disbursements" "$PRES_DISB" "data"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "=== EXTENDED TEST COMPLETE ==="
echo "PASSED: $PASS | FAILED: $FAIL"
