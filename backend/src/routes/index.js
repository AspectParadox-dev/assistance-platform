const { Router } = require('express');

const authRouter = require('./auth.routes');
const applicationsRouter = require('./applications.routes');
const notesRouter = require('./notes.routes');
const documentsRouter = require('./documents.routes');
const decisionsRouter = require('./decisions.routes');
const { disbursementsRouter, appDisbursementsRouter } = require('./disbursements.routes');
const donationsRouter = require('./donations.routes');
const usersRouter = require('./users.routes');
const reportsRouter = require('./reports.routes');
const publicRouter = require('./public.routes');
const formFieldsRouter = require('./form-fields.routes');

const router = Router();

router.use('/auth', authRouter);
router.use('/applications', applicationsRouter);
router.use('/applications/:applicationId/notes', notesRouter);
router.use('/applications/:applicationId/documents', documentsRouter);
router.use('/applications/:applicationId/decisions', decisionsRouter);
router.use('/applications/:applicationId/disbursements', appDisbursementsRouter);
router.use('/disbursements', disbursementsRouter);
router.use('/donations', donationsRouter);
router.use('/users', usersRouter);
router.use('/reports', reportsRouter);
router.use('/public', publicRouter);
router.use('/form-fields', formFieldsRouter);

module.exports = router;
