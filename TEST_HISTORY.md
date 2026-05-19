# Assistance Management Platform — Test & Bug Fix History

## 2026-03-20 — Initial Bug Discovery

Manual testing revealed three issues during early workflow validation:

- **Disbursement scheduling failed** — frontend sent `scheduledDate` as a `YYYY-MM-DD` string; Prisma requires a full ISO-8601 datetime. Fixed in `frontend/src/components/disbursements/DisbursementForm.jsx`.
- **Status timeline "Approved" step not filled** — visual bug in the status stepper left the Approved step unfilled after approval. Fixed in `frontend/src/components/applications/StatusTimeline.jsx`.
- **Bad fix introduced and reverted** — an attempted fix briefly auto-advanced application status to DISBURSEMENT on approval, which broke the disbursement service. Reverted in `backend/src/services/decisions.service.js`.

---

## 2026-03-23 — Manual Testing Round

Three bugs found during hands-on workflow testing across roles:

- **Case managers could advance unassigned applications** — `updateStatus` in `applications.controller.js` had no ownership check. A case manager could advance any application regardless of assignment. Fixed by verifying `assignedCaseManagerId === req.user.userId` for the CASE_MANAGER role before allowing status updates.
- **Backend crash on startup** — `disbursements.service.js` declared `const app` twice in the same `create()` function (once for validation, once after status update for email). Fixed by renaming the second declaration to `updatedApp`.
- **"Advance to Compliance" button silently failed** — `advanceToCompliance()` in `frontend/src/components/applications/ApplicationDetailPage.jsx` had no try/catch block, swallowing all backend errors with no feedback to the user. Added error handling and Alert display. Root cause of the underlying failure was still TBD at this point.

---

## 2026-03-24 — "Advance to Compliance Review" 403 Root Cause Resolved

The silent failure from 2026-03-23 was traced to its root cause:

- **403 "not assigned" for all case managers** — the ownership check in `applications.controller.js` compared against `req.user.userId`, but the auth middleware sets `req.user` to the full Prisma user object. The correct field is `req.user.id`. Because `req.user.userId` was always `undefined`, the ownership check always failed.
- Fix: changed `req.user.userId` → `req.user.id` on line 29 of `backend/src/controllers/applications.controller.js`.

---

## 2026-03-27 — Automated E2E Testing Loop

Three automated test suites were written and executed against the running backend. Two additional bugs were surfaced and fixed.

### Bugs Fixed

- **`cm@example.com` had wrong role in DB** — the seed had given `cm@example.com` the `COMPLIANCE_OFFICER` role instead of `CASE_MANAGER`. This caused the entire case manager workflow to fail: assignment, status advances, and ownership checks. Fixed the role directly in the DB. Updated `seed.js` upsert to use `update: { role: 'CASE_MANAGER' }` so future re-seeds self-correct.
- **Rate limiter too aggressive** — the login rate limiter was set to 10 attempts per 15 minutes, locking out legitimate users during repeated test runs. Fixed to 100 attempts in development and 10 in production, controlled by `NODE_ENV` in `backend/src/routes/auth.routes.js`.

### Test Suite Results

| Suite | Coverage | Assertions | Failures |
|---|---|---|---|
| `e2e_test.sh` | Full happy-path workflow: intake → assign → review → compliance → decision → disbursement → completed | 35 | 0 |
| `e2e_edge_test.sh` | Edge cases & RBAC: rejection, PENDING_INFO, role enforcement, input validation | 18 | 0 |
| `e2e_extended_test.sh` | Extended coverage: tampered JWT, user CRUD/RBAC, deactivated login, pagination, status filters, assignment rules, compliance restrictions, full PENDING_INFO re-review path, double disbursement/double-pay guards, auto-check compliance, notes edge cases, disbursement listing RBAC | 36 | 0 |
| **Total** | | **89** | **0** |

---

## 2026-03-31 — GitHub Sync Verified

- `git diff origin/main` returned nothing — all 136 tracked files matched the remote exactly.
- All bug fixes from the testing iterations (2026-03-20 through 2026-03-27) confirmed present in the repository.
- 3 untracked local files intentionally excluded: `backend/.env` (secrets) and two stray junk files covered by `.gitignore`.
