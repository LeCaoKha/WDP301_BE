const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { authenticateToken } = require("../middleware/auth");

// Subscription Plan CRUD routes (all require authentication)
router.post(
  "/",
  authenticateToken,
  subscriptionController.createSubscriptionPlan
);
router.get(
  "/",
  authenticateToken,
  subscriptionController.getAllSubscriptionPlans
);
router.get(
  "/:id",
  authenticateToken,
  subscriptionController.getSubscriptionPlanById
);
router.put(
  "/:id",
  authenticateToken,
  subscriptionController.updateSubscriptionPlanById
);
router.delete(
  "/:id",
  authenticateToken,
  subscriptionController.deleteSubscriptionPlanById
);
router.patch(
  "/:id/toggle",
  authenticateToken,
  subscriptionController.toggleSubscriptionPlanStatus
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: SubscriptionPlan
 *   description: Subscription plan management
 */
/**
 * @swagger
 * /api/subscription-plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [prepaid]
 *         description: Filter by plan type
 *       - in: query
 *         name: isCompany
 *         schema:
 *           type: boolean
 *         description: Filter by company subscription plans
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [prepaid]
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                     format: decimal
 *                   billing_cycle:
 *                     type: string
 *                     enum: [1 month, 3 months, 6 months, 1 year]
 *                   description:
 *                     type: string
 *                   isCompany:
 *                     type: boolean
 *                   discount:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *   post:
 *     summary: Create a subscription plan
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - price
 *               - billing_cycle
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [prepaid]
 *                 description: Type of subscription plan
 *                 example: "prepaid"
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the subscription plan
 *                 example: "Premium Monthly Plan"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Price of the subscription plan
 *                 example: 29.99
 *               billing_cycle:
 *                 type: string
 *                 enum: [1 month, 3 months, 6 months, 1 year]
 *                 description: Billing cycle for the subscription
 *                 example: "1 month"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed description of the subscription plan
 *                 example: "Premium plan with up to 10 vehicles and priority support"
 *               isCompany:
 *                 type: boolean
 *                 description: Whether this subscription plan is for companies
 *                 default: false
 *                 example: false
 *               discount:
 *                 type: string
 *                 maxLength: 10
 *                 description: Discount percentage (e.g., '15%', '30%')
 *                 example: "15%"
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                   format: decimal
 *                 billing_cycle:
 *                   type: string
 *                 description:
 *                   type: string
 *                 isCompany:
 *                   type: boolean
 *                 discount:
 *                   type: string
 *                 is_active:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/subscription-plans/{id}:
 *   get:
 *     summary: Get subscription plan by id
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                   format: decimal
 *                 billing_cycle:
 *                   type: string
 *                 description:
 *                   type: string
 *                 isCompany:
 *                   type: boolean
 *                 discount:
 *                   type: string
 *                 is_active:
 *                   type: boolean
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
 *         description: Subscription plan not found
 *   put:
 *     summary: Update subscription plan by id
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [prepaid]
 *                 description: Type of subscription plan
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the subscription plan
 *               price:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Price of the subscription plan
 *               billing_cycle:
 *                 type: string
 *                 enum: [1 month, 3 months, 6 months, 1 year]
 *                 description: Billing cycle for the subscription
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed description of the subscription plan
 *               isCompany:
 *                 type: boolean
 *                 description: Whether this subscription plan is for companies
 *               discount:
 *                 type: string
 *                 maxLength: 10
 *                 description: Discount percentage (e.g., '15%', '30%')
 *               is_active:
 *                 type: boolean
 *                 description: Whether the subscription plan is active
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                   format: decimal
 *                 billing_cycle:
 *                   type: string
 *                 description:
 *                   type: string
 *                 isCompany:
 *                   type: boolean
 *                 discount:
 *                   type: string
 *                 is_active:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Subscription plan not found
 *   delete:
 *     summary: Delete subscription plan by id
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription plan deleted successfully"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Subscription plan not found
 */
/**
 * @swagger
 * /api/subscription-plans/{id}/toggle:
 *   patch:
 *     summary: Toggle subscription plan active status
 *     tags: [SubscriptionPlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription plan activated successfully"
 *                 subscriptionPlan:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                       format: decimal
 *                     billing_cycle:
 *                       type: string
 *                     description:
 *                       type: string
 *                     isCompany:
 *                       type: boolean
 *                     discount:
 *                       type: string
 *                     is_active:
 *                       type: boolean
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
 *       404:
 *         description: Subscription plan not found
 */
