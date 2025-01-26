import express from 'express';
import { registerController, loginController, sendVerificationCode, changePasswordController, } from '../../controllers/account/authController.js';
import { authenticateToken } from '../../middleware/auth.js';

//router object
const router = express.Router();
//routing 
//REGISTER
router.post("/register", registerController);
//LOGIN
router.post("/login", loginController);
router.post("/request-verification-code", authenticateToken, sendVerificationCode);
router.post("/change-password", authenticateToken, changePasswordController);
export default router;
