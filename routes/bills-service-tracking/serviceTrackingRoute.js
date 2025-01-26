import express from 'express';
import { getUnitsRemaining, getAllServicesByTenant, getAllServices } from '../../controllers/bills-service-tracking/serviceTrackingController.js';
import { getTenantsRunningByUnits } from '../../controllers/bills-service-tracking/billController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Route to get units remaining for a specific hcmId, tenantId, and serviceType
router.get('/unitsRemaining', authenticateToken, getUnitsRemaining);
router.get('/get-tenants-running-by-units', authenticateToken, getTenantsRunningByUnits);
router.post('/get-all-services-by-tenant', authenticateToken, getAllServicesByTenant);
router.get('/get-all-services', authenticateToken, getAllServices);

export default router;  