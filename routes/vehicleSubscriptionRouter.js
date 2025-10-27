const express = require("express");
const router = express.Router();
const vehicleSubscriptionController = require("../controllers/vehicleSubscriptionController");
const { authenticateToken } = require("../middleware/auth");
const {
  checkExpiredSubscriptionsMiddleware,
} = require("../utils/subscriptionScheduler");

// Vehicle Subscription CRUD routes (all require authentication)
router.post(
  "/",
  authenticateToken,
  vehicleSubscriptionController.createVehicleSubscription
);
router.get(
  "/",
  authenticateToken,
  checkExpiredSubscriptionsMiddleware,
  vehicleSubscriptionController.getAllVehicleSubscriptions
);
router.get(
  "/me",
  authenticateToken,
  checkExpiredSubscriptionsMiddleware,
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
  checkExpiredSubscriptionsMiddleware,
  vehicleSubscriptionController.getSubscriptionsByVehicleId
);
router.get(
  "/check/:vehicleId",
  authenticateToken,
  checkExpiredSubscriptionsMiddleware,
  vehicleSubscriptionController.checkVehicleSubscription
);
router.patch(
  "/:id/auto-renew",
  authenticateToken,
  vehicleSubscriptionController.toggleAutoRenew
);
router.patch(
  "/:id/select-option-after-expire",
  authenticateToken,
  vehicleSubscriptionController.selectOptionAfterExpire
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
 *           enum: [active, expired]
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
 *                           plate_number:
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
 *                           description:
 *                             type: string
 *                           isCompany:
 *                             type: boolean
 *                           discount:
 *                             type: string
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, expired]
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
 * /api/vehicle-subscriptions:
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
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *                 example: "507f1f77bcf86cd799439011"
 *               subscription_id:
 *                 type: string
 *                 description: ID of the subscription plan (start_date and end_date will be auto-calculated based on billing_cycle)
 *                 example: "507f1f77bcf86cd799439012"
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     plate_number:
 *                       type: string
 *                     model:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     company_id:
 *                       type: string
 *                 subscription_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     billing_cycle:
 *                       type: string
 *                     description:
 *                       type: string
 *                     isCompany:
 *                       type: boolean
 *                     discount:
 *                       type: string
 *                 start_date:
 *                   type: string
 *                   format: date-time
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [active, expired]
 *                 auto_renew:
 *                   type: boolean
 *                 payment_status:
 *                   type: string
 *                   enum: [paid, pending, failed, refunded]
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
 *           enum: [active, expired]
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
 *                           plate_number:
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
 *                           description:
 *                             type: string
 *                           isCompany:
 *                             type: boolean
 *                           discount:
 *                             type: string
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, expired]
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     plate_number:
 *                       type: string
 *                     model:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     company_id:
 *                       type: string
 *                 subscription_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     billing_cycle:
 *                       type: string
 *                     description:
 *                       type: string
 *                     isCompany:
 *                       type: boolean
 *                     discount:
 *                       type: string
 *                 start_date:
 *                   type: string
 *                   format: date-time
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [active, expired]
 *                 auto_renew:
 *                   type: boolean
 *                 payment_status:
 *                   type: string
 *                   enum: [paid, pending, failed, refunded]
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
 *                 enum: [active, expired]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vehicle subscription updated successfully"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vehicle_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         plate_number:
 *                           type: string
 *                         model:
 *                           type: string
 *                         user_id:
 *                           type: string
 *                         company_id:
 *                           type: string
 *                     subscription_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         price:
 *                           type: number
 *                         billing_cycle:
 *                           type: string
 *                         description:
 *                           type: string
 *                         isCompany:
 *                           type: boolean
 *                         discount:
 *                           type: string
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [active, expired]
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                       enum: [paid, pending, failed, refunded]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error: Invalid input data"
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
 *           enum: [active, expired]
 *         description: Filter by subscription status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter for currently active subscriptions
 *     responses:
 *       200:
 *         description: List of subscriptions for the vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptions:
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
 *                           plate_number:
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
 *                           description:
 *                             type: string
 *                           isCompany:
 *                             type: boolean
 *                           discount:
 *                             type: string
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, expired]
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
 *                       properties:
 *                         _id:
 *                           type: string
 *                         plate_number:
 *                           type: string
 *                         model:
 *                           type: string
 *                         user_id:
 *                           type: string
 *                         company_id:
 *                           type: string
 *                     subscription_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         price:
 *                           type: number
 *                         billing_cycle:
 *                           type: string
 *                         description:
 *                           type: string
 *                         isCompany:
 *                           type: boolean
 *                         discount:
 *                           type: string
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [active, expired]
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
 *                       enum: [paid, pending, failed, refunded]
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
 * /api/vehicle-subscriptions/{id}/select-option-after-expire:
 *   patch:
 *     summary: Select option after subscription expires
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [no renew, change subscription, renew]
 *                 description: Action to take after subscription expires
 *                 example: "renew"
 *               subscription_plan_id:
 *                 type: string
 *                 description: New subscription plan ID (required only for "change subscription" type)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Operation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Subscription removed successfully"
 *                     type:
 *                       type: string
 *                       example: "no renew"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Subscription renewed successfully"
 *                     type:
 *                       type: string
 *                       example: "renew"
 *                     subscription:
 *                       type: object
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Subscription plan changed successfully"
 *                     type:
 *                       type: string
 *                       example: "change subscription"
 *                     subscription:
 *                       type: object
 *       400:
 *         description: Invalid request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid_type:
 *                       value: "Type must be one of: no renew, change subscription, renew"
 *                     missing_plan_id:
 *                       value: "subscription_plan_id is required for change subscription"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle subscription or subscription plan not found
 *       500:
 *         description: Internal server error
 */
