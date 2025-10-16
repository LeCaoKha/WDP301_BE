const express = require("express");
const router = express.Router();
const chargingSessionController = require("../controllers/chargingSessionController");
const { authenticateToken } = require("../middleware/auth");

// Generate QR Code
router.post(
  "/generate-qr/:booking_id",
  authenticateToken,
  chargingSessionController.generateQRCode
);

// Start session (không cần auth - máy sạc quét)
router.post(
  "/start/:qr_token",
  chargingSessionController.startSessionByQr
);

// End session
router.post(
  "/end/:session_id",
  authenticateToken,
  chargingSessionController.endSession
);

// Get session by ID
router.get(
  "/:session_id",
  authenticateToken,
  chargingSessionController.getSessionById
);

// Get all sessions
router.get(
  "/",
  authenticateToken,
  chargingSessionController.getAllSessions
);

// Cancel session
router.post(
  "/cancel/:session_id",
  authenticateToken,
  chargingSessionController.cancelSession
);

module.exports = router;