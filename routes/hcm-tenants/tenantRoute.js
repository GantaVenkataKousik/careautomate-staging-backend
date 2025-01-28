import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  createTenant,
  assignServicesAndDocuments,
  getServicesAndDocuments,
  updateServiceStatus,
  getAllTenants,
  getTenantNamesByCompany,
  tenantReassessments,
  assignHcmsToTenant,
  getAssignedHcmsToTenant,
  updateTenant,
  tenantProfileEditHistory,
  tenantVisitHistory,
  getTenantInfoById,
  addTenantNote,
  getTenantNotes,
  updateTenantNote,
  deleteTenantNote,
  deleteTenant,
  getTenant,
  getTenantChartInfo,
  tenantsRunningOutOfUnits,
} from "../../controllers/hcm-tenants/tenantController.js";
import { uploadMiddleware } from "../../config/uploadConfig.js";
const router = express.Router();

// Tenant Management Routes
router.post("/create-tenant", authenticateToken, createTenant);
router.get("/get-tenants/:companyId", authenticateToken, getAllTenants);
router.delete("/delete-tenant/:id", authenticateToken, deleteTenant);
router.get("/get-tenant/:id", authenticateToken, getTenant);
router.get(
  "/get-All-tenants/:companyId",
  authenticateToken,
  getTenantNamesByCompany
);

//tenant info routes
router.get(
  "/get-tenant-info/:companyId",
  authenticateToken,
  getTenantChartInfo
);

//tenant chart info
router.get(
  "/get-tenant-chart-info/:companyId",
  authenticateToken,
  getTenantChartInfo
);

router.get(
  "/tenants-running-out-of-units/:companyId",
  authenticateToken,
  tenantsRunningOutOfUnits
);

// Service Management Routes
router.post(
  "/assign-services-documents",
  authenticateToken,
  uploadMiddleware,
  assignServicesAndDocuments
);
router.post("/get-services", authenticateToken, getServicesAndDocuments);
router.post("/update-service-status", authenticateToken, updateServiceStatus);
router.post("/update-service-status", authenticateToken, updateServiceStatus);

router.get(
  "/tenant-reassessments/:companyId",
  authenticateToken,
  tenantReassessments
);

//assigning
router.post("/assign-hcms-to-tenant", authenticateToken, assignHcmsToTenant);
router.post(
  "/get-assigned-hcms-to-tenant",
  authenticateToken,
  getAssignedHcmsToTenant
);
router.put("/update-tenant", authenticateToken, updateTenant);
router.post(
  "/tenant-profile-edit-history",
  authenticateToken,
  tenantProfileEditHistory
);
router.post("/tenant-visit-history", authenticateToken, tenantVisitHistory);
router.post("/get-tenant-info-by-id", authenticateToken, getTenantInfoById);

//adding notes
router.post("/add-tenant-note", authenticateToken, addTenantNote);
router.post("/get-tenant-notes", authenticateToken, getTenantNotes);
router.post("/update-tenant-note", authenticateToken, updateTenantNote);
router.post("/delete-tenant-note", authenticateToken, deleteTenantNote);

export default router;
