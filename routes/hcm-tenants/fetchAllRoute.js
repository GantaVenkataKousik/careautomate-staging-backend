import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { getAllHCMsTenants } from '../../controllers/hcm-tenants/fetchAllController.js';

const router = express.Router();

//routing 
router.get("/fetchAllHCMsTenants", authenticateToken, getAllHCMsTenants);
export default router;
