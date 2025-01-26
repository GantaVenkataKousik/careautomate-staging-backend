// routes/billRoutes.js
import express from 'express';
import { getTenantsRunningByUnits, planUsage, markBillAsPaid, getBillsDone, getBillsPending, getBillsRejected, getBillClaim, getBillsPendingByTenant, getBillsCompletedByTenant } from '../../controllers/bills-service-tracking/billController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get('/tenants-running-out-of-units/:companyId', authenticateToken, getTenantsRunningByUnits);

router.post('/plan-usage', authenticateToken, planUsage);

router.post("/mark-bill-as-paid/:companyId", authenticateToken, markBillAsPaid);

router.get('/get-bills-done/:companyId', authenticateToken, getBillsDone);

router.get('/get-bills-pending/:companyId', authenticateToken, getBillsPending);

router.get("/get-bill-claim/:companyId", authenticateToken, getBillClaim);

router.get('/get-bills-rejected', authenticateToken, getBillsRejected);

router.post("/get-bills-pending-by-tenant", authenticateToken, getBillsPendingByTenant);

router.post('/get-bills-completed-by-tenant', authenticateToken, getBillsCompletedByTenant);

export default router;