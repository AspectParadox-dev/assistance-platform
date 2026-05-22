const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prismaClient');

const router = Router();

const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Too many status check attempts. Please try again in 15 minutes.' },
});

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLIANCE_REVIEW: 'Under Review',
  PENDING_DECISION: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Not Approved',
  PENDING_INFO: 'Additional Information Required',
  DISBURSEMENT: 'Payment in Progress',
  COMPLETED: 'Completed',
};

/**
 * GET /api/public/org/:orgSlug/form
 * Returns the org's custom form fields ordered by `order` asc.
 * Returns empty array if org has no custom fields.
 */
router.get('/org/:orgSlug/form', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.orgSlug },
      select: { id: true, isActive: true },
    });
    if (!org || !org.isActive) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    const fields = await prisma.formField.findMany({
      where: { organizationId: org.id },
      orderBy: { order: 'asc' },
      select: { id: true, label: true, fieldKey: true, fieldType: true, required: true, placeholder: true, options: true },
    });
    res.json(fields);
  } catch (err) { next(err); }
});

/**
 * GET /api/public/org/:orgSlug
 * Returns public info for an org (name + slug) so the intake page can display the org name.
 * Returns 404 if not found or inactive.
 */
router.get('/org/:orgSlug', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.orgSlug },
      select: { name: true, slug: true, isActive: true },
    });
    if (!org || !org.isActive) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ name: org.name, slug: org.slug });
  } catch (err) { next(err); }
});

/**
 * POST /api/public/status
 * Body: { orgSlug, referenceNumber, email }
 *
 * Returns a safe, public-facing summary of the application status scoped to the org.
 * Requires orgSlug + referenceNumber + email to all match — prevents enumeration.
 */
router.post(
  '/status',
  statusLimiter,
  [
    body('orgSlug').notEmpty().withMessage('orgSlug is required'),
    body('referenceNumber').notEmpty().withMessage('Reference number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orgSlug, referenceNumber, email } = req.body;

      const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
      if (!org || !org.isActive) {
        return res.status(404).json({ error: 'No application found with that reference number and email combination.' });
      }

      const app = await prisma.application.findFirst({
        where: {
          organizationId: org.id,
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

      if (!app) {
        return res.status(404).json({
          error: 'No application found with that reference number and email combination.',
        });
      }

      const STAGES = [
        { key: 'SUBMITTED', label: 'Submitted' },
        { key: 'UNDER_REVIEW', label: 'Under Review' },
        { key: 'PENDING_DECISION', label: 'Decision Pending' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'DISBURSEMENT', label: 'Payment Processing' },
        { key: 'COMPLETED', label: 'Completed' },
      ];

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
