const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { authenticateToken } = require("../middleware/auth");

// Vehicle CRUD routes (all require authentication)
router.post("/", authenticateToken, vehicleController.createVehicle);
router.get("/", authenticateToken, vehicleController.getAllVehicles);
router.get("/me", authenticateToken, vehicleController.getMyVehicles);
router.get("/:id", authenticateToken, vehicleController.getVehicleById);
router.put("/:id", authenticateToken, vehicleController.updateVehicleById);
router.delete("/:id", authenticateToken, vehicleController.deleteVehicleById);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Vehicle
 *   description: Vehicle management
 */
/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isCompany
 *         schema:
 *           type: boolean
 *         description: Filter vehicles by company ownership (true = company vehicles, false = personal vehicles)
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   user_id:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                   company_id:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       contact_email:
 *                         type: string
 *                   plate_number:
 *                     type: string
 *                   model:
 *                     type: string
 *                   batteryCapacity:
 *                     type: number
 *                   vehicle_subscription_id:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
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
 *                       auto_renew:
 *                         type: boolean
 *                       payment_status:
 *                         type: string
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
 *     summary: Create a vehicle
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user who owns the vehicle
 *               company_id:
 *                 type: string
 *                 description: ID of the company that manages the vehicle
 *               plate_number:
 *                 type: string
 *                 description: Vehicle license plate number
 *               model:
 *                 type: string
 *                 description: Vehicle model
 *               batteryCapacity:
 *                 type: number
 *                 format: double
 *                 description: Battery capacity in kWh
 *     responses:
 *       201:
 *         description: Vehicle created
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/vehicles/me:
 *   get:
 *     summary: Get my vehicles (current user's vehicles)
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: isCompany
 *         schema:
 *           type: boolean
 *         description: Filter vehicles by company ownership (true = company vehicles, false = personal vehicles)
 *     responses:
 *       200:
 *         description: List of current user's vehicles with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
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
 *                       company_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           contact_email:
 *                             type: string
 *                       plate_number:
 *                         type: string
 *                       model:
 *                         type: string
 *                       batteryCapacity:
 *                         type: number
 *                       vehicle_subscription_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           subscription_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               billing_cycle:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               isCompany:
 *                                 type: boolean
 *                               discount:
 *                                 type: string
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           auto_renew:
 *                             type: boolean
 *                           payment_status:
 *                             type: string
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
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by id
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 user_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                 company_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     contact_email:
 *                       type: string
 *                 plate_number:
 *                   type: string
 *                 model:
 *                   type: string
 *                 batteryCapacity:
 *                   type: number
 *                 vehicle_subscription_id:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
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
 *                     auto_renew:
 *                       type: boolean
 *                     payment_status:
 *                       type: string
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
 *         description: Vehicle not found
 *   put:
 *     summary: Update vehicle by id
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user who owns the vehicle
 *               company_id:
 *                 type: string
 *                 description: ID of the company that manages the vehicle
 *               plate_number:
 *                 type: string
 *                 description: Vehicle license plate number
 *               model:
 *                 type: string
 *                 description: Vehicle model
 *               batteryCapacity:
 *                 type: number
 *                 format: double
 *                 description: Battery capacity in kWh
 *     responses:
 *       200:
 *         description: Updated vehicle
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle not found
 *   delete:
 *     summary: Delete vehicle by id
 *     tags: [Vehicle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle deleted
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vehicle not found
 */
