// routes/visitRoutes.js
// routes/visitRoutes.js
// routes/visitRoutes.js
import express from 'express';
import {
  createVisit,
  updateVisit,
  deleteVisit,
  visitsWaitingForApproval,
  markVisitAsApproved,
  getVisitsComplianceReports,
  getVisits,
  getVisitsCompliance,
  filterVisits,
  getVisitsCount,
} from '../../controllers/appointments-visits/visitsController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/create-visit', authenticateToken, createVisit);

router.get('/get-visits/:companyId', authenticateToken, getVisits);

router.delete('/delete-visit/:id', authenticateToken, deleteVisit);

router.put('/update-visit/:id', authenticateToken, updateVisit);

router.get(
  '/visits-waiting-for-approval/:companyId',
  authenticateToken,
  visitsWaitingForApproval
);

router.post('/mark-visit-as-approved/:companyId', markVisitAsApproved);

//visits compliance reports
router.get(
  '/visits-compliance-reports/:companyId',
  authenticateToken,
  getVisitsComplianceReports
);

router.post('/filter-visits/:companyId', authenticateToken, filterVisits);
//visit compliance
router.get(
  '/visits-compliance/:companyId',
  authenticateToken,
  getVisitsCompliance
);

//visits count
router.get('/get-visits-count/:companyId', authenticateToken, getVisitsCount);

export default router;
