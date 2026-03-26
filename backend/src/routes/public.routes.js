const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prismaClient');

const router = Router();

// Prevent enumeration of reference numbers by brute-force
const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 status checks per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Too many status check attempts. Please try again in 15 minutes.' },
});

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLIANCE_REVIEW: 'Under Review',       // don't expose internal stage name
  PENDING_DECISION: 'Under Review',        // same
  APPROVED: 'Approved',
  REJECTED: 'Not Approved',
  PENDING_INFO: 'Additional Information Required',
  DISBURSEMENT: 'Payment in Progress',
  COMPLETED: 'Completed',
};

/**
 * POST /api/public/status
 * Body: { referenceNumber, email }
 *
 * Returns a safe, public-facing summary of the application status.
 * Requires both referenceNumber AND email to match — prevents enumeration.
 */
router.post(
  '/status',
  statusLimiter,
  [
    body('referenceNumber').notEmpty().withMessage('Reference number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { referenceNumber, email } = req.body;

      const app = await prisma.application.findFirst({
        where: {
          referenceNumber: referenceNumber.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
        },
        include: {
          decisions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { outcome: true, approvedAmount: true, createdAt: true },
          },
        },
      });

      // Return the same generic message whether not found or email mismatch
      if (!app) {
        return res.status(404).json({
          error: 'No application found with that reference number and email combination.',
        });
      }

      // Build a public-safe timeline so the applicant can see where they are
      const STAGES = [
        { key: 'SUBMITTED', label: 'Submitted' },
        { key: 'UNDER_REVIEW', label: 'Under Review' },
        { key: 'PENDING_DECISION', label: 'Decision Pending' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'DISBURSEMENT', label: 'Payment Processing' },
        { key: 'COMPLETED', label: 'Completed' },
      ];

      // Map actual status to a timeline step index
      const STATUS_TO_STEP = {
        SUBMITTED: 0,
        UNDER_REVIEW: 1,
        COMPLIANCE_REVIEW: 1,
        PENDING_DECISION: 2,
        PENDING_INFO: 2,
        APPROVED: 3,
        REJECTED: 3,
        DISBURSEMENT: 4,
        COMPLETED: 5,
      };

      const currentStep = STATUS_TO_STEP[app.status] ?? 0;
      const latestDecision = app.decisions[0] || null;

      res.json({
        referenceNumber: app.referenceNumber,
        firstName: app.firstName,
        status: app.status,
        statusLabel: STATUS_LABELS[app.status] || app.status,
        isRejected: app.status === 'REJECTED',
        isPendingInfo: app.status === 'PENDING_INFO',
        submittedAt: app.createdAt,
        updatedAt: app.updatedAt,
        timeline: {
          stages: STAGES,
          currentStep,
        },
        ...(latestDecision && app.status === 'APPROVED' && latestDecision.approvedAmount
          ? { approvedAmount: latestDecision.approvedAmount }
          : {}),
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
