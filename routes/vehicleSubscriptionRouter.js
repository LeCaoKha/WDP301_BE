const express = require("express");
const router = express.Router();
const vehicleSubscriptionController = require("../controllers/vehicleSubscriptionController");
const { authenticateToken } = require("../middleware/auth");

// Vehicle Subscription CRUD routes (all require authentication)
router.post(
  "/",
  authenticateToken,
  vehicleSubscriptionController.createVehicleSubscription
);
router.get(
  "/",
  authenticateToken,
  vehicleSubscriptionController.getAllVehicleSubscriptions
);
router.get(
  "/me",
  authenticateToken,
  vehicleSubscriptionController.getMyVehicleSubscriptions
);
router.get(
  "/:id",
  authenticateToken,
  vehicleSubscriptionController.getVehicleSubscriptionById
);
router.put(
  "/:id",
  authenticateToken,
  vehicleSubscriptionController.updateVehicleSubscriptionById
);
router.delete(
  "/:id",
  authenticateToken,
  vehicleSubscriptionController.deleteVehicleSubscriptionById
);

// Additional routes
router.get(
  "/vehicle/:vehicleId",
  authenticateToken,
  vehicleSubscriptionController.getSubscriptionsByVehicleId
);
router.get(
  "/check/:vehicleId",
  authenticateToken,
  vehicleSubscriptionController.checkVehicleSubscription
);
router.patch(
  "/:id/extend",
  authenticateToken,
  vehicleSubscriptionController.extendSubscription
);
router.patch(
  "/:id/cancel",
  authenticateToken,
  vehicleSubscriptionController.cancelSubscription
);
router.patch(
  "/:id/auto-renew",
  authenticateToken,
  vehicleSubscriptionController.toggleAutoRenew
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: VehicleSubscription
 *   description: Vehicle subscription management
 */
/**
 * @swagger
 * /api/vehicle-subscriptions:
 *   get:
 *     summary: Get all vehicle subscriptions
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: subscription_id
 *         schema:
 *           type: string
 *         description: Filter by subscription plan ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled, suspended]
 *         description: Filter by subscription status
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [paid, pending, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter for currently active subscriptions
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
 *         description: List of vehicle subscriptions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicleSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
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
 *                       subscription_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           billing_cycle:
 *                             type: string
 *                           limit_type:
 *                             type: string
 *                           limit_value:
 *                             type: number
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, expired, cancelled, suspended]
 *                       auto_renew:
 *                         type: boolean
 *                       payment_status:
 *                         type: string
 *                         enum: [paid, pending, failed, refunded]
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
 * /api/vehicle-subscriptions/me:
 *   get:
 *     summary: Get my vehicle subscriptions (current user's vehicle subscriptions)
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled, suspended]
 *         description: Filter by subscription status
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
 *         description: List of current user's vehicle subscriptions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicleSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
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
 *                       subscription_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           billing_cycle:
 *                             type: string
 *                           limit_type:
 *                             type: string
 *                           limit_value:
 *                             type: number
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, expired, cancelled, suspended]
 *                       auto_renew:
 *                         type: boolean
 *                       payment_status:
 *                         type: string
 *                         enum: [paid, pending, failed, refunded]
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
 *     summary: Create a vehicle subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - subscription_id
 *               - start_date
 *               - end_date
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *                 example: "507f1f77bcf86cd799439011"
 *               subscription_id:
 *                 type: string
 *                 description: ID of the subscription plan
 *                 example: "507f1f77bcf86cd799439012"
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the subscription
 *                 example: "2024-01-01T00:00:00.000Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the subscription
 *                 example: "2024-02-01T00:00:00.000Z"
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *                 default: false
 *                 example: false
 *               payment_status:
 *                 type: string
 *                 enum: [paid, pending, failed, refunded]
 *                 description: Payment status of the subscription
 *                 default: pending
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Vehicle subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 vehicle_id:
 *                   type: object
 *                 subscription_id:
 *                   type: object
 *                 start_date:
 *                   type: string
 *                   format: date-time
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 auto_renew:
 *                   type: boolean
 *                 payment_status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or vehicle already has a subscription
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}:
 *   get:
 *     summary: Get vehicle subscription by id
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     responses:
 *       200:
 *         description: Vehicle subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 vehicle_id:
 *                   type: object
 *                 subscription_id:
 *                   type: object
 *                 start_date:
 *                   type: string
 *                   format: date-time
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 auto_renew:
 *                   type: boolean
 *                 payment_status:
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
 *         description: Vehicle subscription not found
 *   put:
 *     summary: Update vehicle subscription by id
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *               subscription_id:
 *                 type: string
 *                 description: ID of the subscription plan
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the subscription
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the subscription
 *               status:
 *                 type: string
 *                 enum: [active, expired, cancelled, suspended]
 *                 description: Status of the subscription
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *               payment_status:
 *                 type: string
 *                 enum: [paid, pending, failed, refunded]
 *                 description: Payment status of the subscription
 *     responses:
 *       200:
 *         description: Vehicle subscription updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 *   delete:
 *     summary: Delete vehicle subscription by id
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     responses:
 *       200:
 *         description: Vehicle subscription deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vehicle subscription deleted successfully"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}/auto-renew:
 *   patch:
 *     summary: Toggle auto renew for subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auto_renew
 *             properties:
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *                 example: true
 *     responses:
 *       200:
 *         description: Auto renew status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auto renew enabled successfully"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vehicle_id:
 *                       type: object
 *                     subscription_id:
 *                       type: object
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid auto_renew value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "auto_renew must be a boolean value (true or false)"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/vehicle/{vehicleId}:
 *   get:
 *     summary: Get subscriptions by vehicle ID
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled, suspended]
 *         description: Filter by subscription status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter for currently active subscriptions
 *     responses:
 *       200:
 *         description: List of subscriptions for the vehicle
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/check/{vehicleId}:
 *   get:
 *     summary: Check if vehicle has a subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasSubscription:
 *                   type: boolean
 *                   description: Whether the vehicle has a subscription
 *                 message:
 *                   type: string
 *                   description: Message about subscription status
 *                 subscription:
 *                   type: object
 *                   description: Subscription details (if exists)
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vehicle_id:
 *                       type: object
 *                     subscription_id:
 *                       type: object
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}/extend:
 *   patch:
 *     summary: Extend subscription by number of days
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - days
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of days to extend the subscription
 *                 example: 30
 *     responses:
 *       200:
 *         description: Subscription extended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription extended by 30 days"
 *                 subscription:
 *                   type: object
 *       400:
 *         description: Invalid days value
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}/auto-renew:
 *   patch:
 *     summary: Toggle auto renew for subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auto_renew
 *             properties:
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *                 example: true
 *     responses:
 *       200:
 *         description: Auto renew status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auto renew enabled successfully"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vehicle_id:
 *                       type: object
 *                     subscription_id:
 *                       type: object
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid auto_renew value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "auto_renew must be a boolean value (true or false)"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription cancelled successfully"
 *                 subscription:
 *                   type: object
 *       400:
 *         description: Subscription already cancelled
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
/**
 * @swagger
 * /api/vehicle-subscriptions/{id}/auto-renew:
 *   patch:
 *     summary: Toggle auto renew for subscription
 *     tags: [VehicleSubscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auto_renew
 *             properties:
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *                 example: true
 *     responses:
 *       200:
 *         description: Auto renew status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auto renew enabled successfully"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vehicle_id:
 *                       type: object
 *                     subscription_id:
 *                       type: object
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid auto_renew value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "auto_renew must be a boolean value (true or false)"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription not found
 */
