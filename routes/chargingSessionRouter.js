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

/**
 * @swagger
 * tags:
 *   name: ChargingSession
 *   description: Charging session management and QR code handling
 */
/**
 * @swagger
 * /api/charging-sessions:
 *   get:
 *     summary: Get all charging sessions
 *     tags: [ChargingSession]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter by session status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of charging sessions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       booking_id:
 *                         type: object
 *                       chargingPoint_id:
 *                         type: object
 *                       vehicle_id:
 *                         type: object
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, in_progress, completed, cancelled]
 *                       initial_battery_level:
 *                         type: number
 *                       final_battery_level:
 *                         type: number
 *                       energy_delivered_kwh:
 *                         type: number
 *                       charging_duration_minutes:
 *                         type: number
 *                       base_fee:
 *                         type: number
 *                       price_per_kwh:
 *                         type: number
 *                       charging_fee:
 *                         type: number
 *                       total_amount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/charging-sessions/generate-qr/{booking_id}:
 *   post:
 *     summary: Generate QR code for charging session
 *     tags: [ChargingSession]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID to generate QR code for
 *     responses:
 *       200:
 *         description: QR Code already exists for this booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "QR Code already exists"
 *                 session_id:
 *                   type: string
 *                 qr_code_token:
 *                   type: string
 *                 qr_url:
 *                   type: string
 *       201:
 *         description: QR Code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "QR Code generated successfully"
 *                 session_id:
 *                   type: string
 *                 qr_code_token:
 *                   type: string
 *                 qr_url:
 *                   type: string
 *                   description: URL to start the charging session
 *                 booking_info:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     station:
 *                       type: string
 *                     charging_point:
 *                       type: string
 *                     vehicle:
 *                       type: string
 *       400:
 *         description: Booking must be confirmed or pending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking must be confirmed or pending"
 *                 current_status:
 *                   type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/charging-sessions/start/{qr_token}:
 *   post:
 *     summary: Start charging session by QR code (no auth required - for charging machine)
 *     tags: [ChargingSession]
 *     parameters:
 *       - in: path
 *         name: qr_token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code token from the generated QR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - initial_battery_percentage
 *             properties:
 *               initial_battery_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Initial battery percentage (0-100)
 *                 example: 30
 *     responses:
 *       200:
 *         description: Charging session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session started successfully"
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     initial_battery:
 *                       type: string
 *                       example: "30%"
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *                     charging_point:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         power_capacity:
 *                           type: string
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         plate_number:
 *                           type: string
 *                         model:
 *                           type: string
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         base_fee:
 *                           type: string
 *                         price_per_kwh:
 *                           type: string
 *       400:
 *         description: Invalid request or session already started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid_battery:
 *                       value: "initial_battery_percentage is required (0-100)"
 *                     already_started:
 *                       value: "Session already started"
 *                     charging_point_not_available:
 *                       value: "Charging point is in_use"
 *       404:
 *         description: Invalid QR code
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/charging-sessions/end/{session_id}:
 *   post:
 *     summary: End charging session
 *     tags: [ChargingSession]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging session ID
 *     responses:
 *       200:
 *         description: Charging session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session ended successfully"
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: string
 *                       example: "2 hours 30 minutes"
 *                     duration_minutes:
 *                       type: number
 *                     initial_battery:
 *                       type: string
 *                     energy_delivered:
 *                       type: string
 *                       example: "50.00 kWh"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                 fee_calculation:
 *                   type: object
 *                   properties:
 *                     base_fee:
 *                       type: number
 *                     charging_fee:
 *                       type: number
 *                     total_amount:
 *                       type: number
 *                     base_fee_formatted:
 *                       type: string
 *                     charging_fee_formatted:
 *                       type: string
 *                     total_amount_formatted:
 *                       type: string
 *                 payment_data:
 *                   type: object
 *                   properties:
 *                     session_id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     vehicle_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Session is not in progress or has not started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session is not in progress"
 *                 current_status:
 *                   type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/charging-sessions/{session_id}:
 *   get:
 *     summary: Get charging session by id
 *     tags: [ChargingSession]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging session ID
 *     responses:
 *       200:
 *         description: Charging session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 booking_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     station_id:
 *                       type: string
 *                     vehicle_id:
 *                       type: string
 *                     chargingPoint_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                 chargingPoint_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     stationId:
 *                       type: string
 *                     power_capacity:
 *                       type: number
 *                     status:
 *                       type: string
 *                 vehicle_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     plate_number:
 *                       type: string
 *                     model:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [pending, in_progress, completed, cancelled]
 *                 initial_battery_level:
 *                   type: number
 *                 final_battery_level:
 *                   type: number
 *                 energy_delivered_kwh:
 *                   type: number
 *                 charging_duration_minutes:
 *                   type: number
 *                 charging_duration_hours:
 *                   type: number
 *                 base_fee:
 *                   type: number
 *                 price_per_kwh:
 *                   type: number
 *                 charging_fee:
 *                   type: number
 *                 total_amount:
 *                   type: number
 *                 qr_code_token:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/charging-sessions/cancel/{session_id}:
 *   post:
 *     summary: Cancel charging session
 *     tags: [ChargingSession]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging session ID
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session cancelled successfully"
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     booking_id:
 *                       type: string
 *                     chargingPoint_id:
 *                       type: object
 *                     vehicle_id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Cannot cancel completed session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot cancel completed session"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */