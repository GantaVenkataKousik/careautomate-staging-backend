import express from 'express';
import {
  getCompanyReports,
  updateCompanyData,
  deleteCompany,
  getSuperAdminData,
  getAllVisitsCount,
  getAllAppointmentsCount,
} from '../../controllers/account/superAdminController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// router.get('/get-super-admin-details', authenticateToken, getSuperAdminDetails);

//superadmin reports
router.get('/get-company-reports', authenticateToken, getCompanyReports);

//update company data
router.put('/update-company-data/', authenticateToken, updateCompanyData);

//delete company
router.delete('/delete-company/:companyId', authenticateToken, deleteCompany);

//superadmin data
router.get(
  '/get-super-admin-data/:adminId',
  authenticateToken,
  getSuperAdminData
);

//visits count of all companies
router.get('/get-all-visits-count', authenticateToken, getAllVisitsCount);
export default router;

//appointments count of all companies
router.get(
  '/get-all-appointments-count',
  authenticateToken,
  getAllAppointmentsCount
);
