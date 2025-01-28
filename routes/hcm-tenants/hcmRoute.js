import express from "express";
import multer from "multer";
import {
  createHcm,
  assignServicesAndDocuments,
  getServicesAndDocuments,
  uploadDocument,
  fetchDocuments,
  getAssignedTenantsToHcm,
  getHcmInfo,
  hcmVisitHistory,
  assignTenantsToHcm,
  getHcm,
  getHcms,
  updateHcm,
  deleteHcm,
  getHcmChartInfo,
  getHCMNamesByCompany,
} from "../../controllers/hcm-tenants/hcmController.js";
import { authenticateToken } from "../../middleware/auth.js";
import { getHcmUnitsStats } from "../../controllers/bills-service-tracking/serviceTrackingController.js";
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// HCM management routes
router.post("/create-hcm", authenticateToken, createHcm);
router.get("/get-hcm/:id", authenticateToken, getHcm);
router.get("/get-hcms/:companyId", authenticateToken, getHcms);
router.put("/update-hcm", authenticateToken, updateHcm);
router.delete("/delete-hcm/:id", authenticateToken, deleteHcm);

router.get("/get-hcm-info/:id", authenticateToken, getHcmInfo);

router.get(
  "/get-hcm-chart-info/:companyId",
  authenticateToken,
  getHcmChartInfo
);

router.post("/assign-tenants-to-hcm", authenticateToken, assignTenantsToHcm);

// Service and Document management routes
router.post(
  "/assign-services-documents",
  authenticateToken,
  upload.array("document"),
  assignServicesAndDocuments
);
router.post(
  "/get-services-documents",
  authenticateToken,
  getServicesAndDocuments
);

// Add these new routes
router.post(
  "/upload-document",
  authenticateToken,
  upload.single("document"),
  uploadDocument
);

router.post("/fetch-documents", authenticateToken, fetchDocuments);

router.post("/assign-tenants-to-hcm", authenticateToken, assignTenantsToHcm);
router.post("/hcmUnitsStats", authenticateToken, getHcmUnitsStats);
router.post(
  "/get-assigned-tenants-to-hcm",
  authenticateToken,
  getAssignedTenantsToHcm
);

router.post("/hcm-visit-history", authenticateToken, hcmVisitHistory);

router.get("/get-All-hcms/:companyId", authenticateToken, getHCMNamesByCompany);

export default router;
