const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken } = require("../middleware/auth");

// Booking CRUD routes (all require authentication)
router.post("/", authenticateToken, bookingController.createBooking);
router.get("/", authenticateToken, bookingController.getAllBookings);
router.get("/me", authenticateToken, bookingController.getMyBookings);
router.get("/:id", authenticateToken, bookingController.getBookingById);
router.put("/:id", authenticateToken, bookingController.updateBookingById);
router.delete("/:id", authenticateToken, bookingController.deleteBookingById);

// Additional routes
router.get(
  "/user/:userId",
  authenticateToken,
  bookingController.getBookingsByUserId
);
router.get(
  "/station/:stationId",
  authenticateToken,
  bookingController.getBookingsByStationId
);
router.patch("/:id/cancel", authenticateToken, bookingController.cancelBooking);
router.patch(
  "/:id/confirm",
  authenticateToken,
  bookingController.confirmBooking
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: Charging station booking management
 */
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *         description: Filter by station ID
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: chargingPoint_id
 *         schema:
 *           type: string
 *         description: Filter by charging point ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, expired]
 *         description: Filter by booking status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
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
 *         description: List of bookings with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                       station_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           location:
 *                             type: object
 *                       vehicle_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           license_plate:
 *                             type: string
 *                           model:
 *                             type: string
 *                           user_id:
 *                             type: string
 *                           company_id:
 *                             type: string
 *                       chargingPoint_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           power_rating:
 *                             type: number
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, active, completed, cancelled, expired]
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
 */
/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Get my bookings (current user's bookings)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, expired]
 *         description: Filter by booking status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
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
 *         description: List of current user's bookings with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       station_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           location:
 *                             type: object
 *                       vehicle_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           license_plate:
 *                             type: string
 *                           model:
 *                             type: string
 *                           user_id:
 *                             type: string
 *                           company_id:
 *                             type: string
 *                       chargingPoint_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           power_rating:
 *                             type: number
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, active, completed, cancelled, expired]
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
 *   post:
 *     summary: Create a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - station_id
 *               - vehicle_id
 *               - chargingPoint_id
 *               - start_time
 *               - end_time
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user making the booking
 *                 example: "507f1f77bcf86cd799439011"
 *               station_id:
 *                 type: string
 *                 description: ID of the charging station
 *                 example: "507f1f77bcf86cd799439012"
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *                 example: "507f1f77bcf86cd799439013"
 *               chargingPoint_id:
 *                 type: string
 *                 description: ID of the charging point
 *                 example: "507f1f77bcf86cd799439014"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the booking
 *                 example: "2024-01-15T10:00:00.000Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the booking
 *                 example: "2024-01-15T12:00:00.000Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 user_id:
 *                   type: object
 *                 station_id:
 *                   type: object
 *                 vehicle_id:
 *                   type: object
 *                 chargingPoint_id:
 *                   type: object
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                 end_time:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or time conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     user_not_found:
 *                       value: "User not found"
 *                     station_not_found:
 *                       value: "Station not found"
 *                     vehicle_not_found:
 *                       value: "Vehicle not found"
 *                     charging_point_not_found:
 *                       value: "Charging point not found"
 *                     charging_point_mismatch:
 *                       value: "Charging point does not belong to the specified station"
 *                     invalid_time:
 *                       value: "End time must be after start time"
 *                     past_time:
 *                       value: "Start time must be in the future"
 *                     time_conflict:
 *                       value: "Time slot is already booked for this charging point"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by id
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 user_id:
 *                   type: object
 *                 station_id:
 *                   type: object
 *                 vehicle_id:
 *                   type: object
 *                 chargingPoint_id:
 *                   type: object
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                 end_time:
 *                   type: string
 *                   format: date-time
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
 *         description: Booking not found
 *   put:
 *     summary: Update booking by id
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user
 *               station_id:
 *                 type: string
 *                 description: ID of the charging station
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *               chargingPoint_id:
 *                 type: string
 *                 description: ID of the charging point
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the booking
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the booking
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, active, completed, cancelled, expired]
 *                 description: Status of the booking
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Validation error or time conflict
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Booking not found
 *   delete:
 *     summary: Delete booking by id
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking deleted successfully"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Booking not found
 */
/**
 * @swagger
 * /api/bookings/user/{userId}:
 *   get:
 *     summary: Get bookings by user ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, expired]
 *         description: Filter by booking status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of bookings for the user
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/bookings/station/{stationId}:
 *   get:
 *     summary: Get bookings by station ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, expired]
 *         description: Filter by booking status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of bookings for the station
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking cancelled successfully"
 *                 booking:
 *                   type: object
 *       400:
 *         description: Booking cannot be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking cannot be cancelled at this time"
 *                 currentStatus:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Booking not found
 */
/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking confirmed successfully"
 *                 booking:
 *                   type: object
 *       400:
 *         description: Only pending bookings can be confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only pending bookings can be confirmed"
 *                 currentStatus:
 *                   type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Booking not found
 */
