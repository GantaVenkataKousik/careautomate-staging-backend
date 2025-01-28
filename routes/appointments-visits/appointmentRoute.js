import express from "express";
import {
  createAppointment,
  filterAppointments,
  fetchAppointments,
  updateAppointment,
  deleteAppointment,
  markAppointmentComplete,
  getUnitsLeft,
  getAppointments,
} from "../../controllers/appointments-visits/appointmentsController.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// Create an appointment
router.post("/create-appointment", authenticateToken, createAppointment);

router.get("/get-appointments/:companyId", authenticateToken, getAppointments);

// // Filter appointments
router.post("/filter-appointments", authenticateToken, filterAppointments);

// router.get('/get-appointments', authenticateToken, getAppointments);
// // Fetch all appointments
// router.get('/fetchGroupedAppointments', authenticateToken, fetchAppointments);

// // Update an appointment
// router.put('/:id', authenticateToken, updateAppointment);

// // Delete an appointment
router.delete("/delete-appointment/:id", authenticateToken, deleteAppointment);

// // Update an appointment
router.put("/update-appointment/:id", authenticateToken, updateAppointment);

router.put(
  "/mark-appointment-complete/:id",
  authenticateToken,
  markAppointmentComplete
);

// router.post('/get-units-left', getUnitsLeft);

export default router;
