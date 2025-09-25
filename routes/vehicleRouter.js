const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { authenticateToken } = require("../middleware/auth");

// Vehicle CRUD routes (all require authentication)
router.post("/", authenticateToken, vehicleController.createVehicle);
router.get("/", authenticateToken, vehicleController.getAllVehicles);
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
 *     responses:
 *       200:
 *         description: List of vehicles
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
 *               accountId:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               batteryCapacity:
 *                 type: number
 *                 format: double
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
 *               accountId:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               batteryCapacity:
 *                 type: number
 *                 format: double
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
