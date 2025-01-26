import express from 'express';
import { getCompanyReports, updateCompanyData, deleteCompany } from '../../controllers/account/superAdminController.js';
import { authenticateToken } from '../../middleware/auth.js';


const router = express.Router();

// router.get('/get-super-admin-details', authenticateToken, getSuperAdminDetails);

//superadmin reports
router.get("/get-company-reports", authenticateToken, getCompanyReports);

//update company data
router.put("/update-company-data/", authenticateToken, updateCompanyData);

//delete company
router.delete("/delete-company/:companyId", authenticateToken, deleteCompany);

export default router;