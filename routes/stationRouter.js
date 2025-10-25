const express = require('express');
const { authenticateToken } = require("../middleware/auth");
const StationController = require('../controllers/stationController.js');
const router = express.Router();
router.post('/', authenticateToken, StationController.createStation);
router.get('/', authenticateToken, StationController.getStations);
router.get('/:id', authenticateToken, StationController.getStationById);
router.get('/:id/charging-points', authenticateToken, StationController.getChargingPointsByStation);
router.put('/:id', authenticateToken, StationController.updateStation);
router.delete('/:id', authenticateToken, StationController.deleteStation);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Station
 *   description: Charging station management
 */
/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Get all stations
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of charging stations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   connector_type:
 *                     type: string
 *                     enum: [AC, DC]
 *                   status:
 *                     type: string
 *                     enum: [online, offline, maintenance]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *   post:
 *     summary: Create a new station
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - connector_type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the station (must be unique)
 *                 example: "Station A"
 *               address:
 *                 type: string
 *                 description: Address of the station
 *                 example: "123 Main Street, City"
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *                 example: 10.762622
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *                 example: 106.660172
 *               connector_type:
 *                 type: string
 *                 enum: [AC, DC]
 *                 description: Type of connector
 *                 example: "AC"
 *               status:
 *                 type: string
 *                 enum: [online, offline, maintenance]
 *                 default: online
 *                 description: Status of the station
 *                 example: "online"
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 connector_type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Get station by id
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Station details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 connector_type:
 *                   type: string
 *                   enum: [AC, DC]
 *                 status:
 *                   type: string
 *                   enum: [online, offline, maintenance]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Station not found
 *   put:
 *     summary: Update station by id
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the station
 *               address:
 *                 type: string
 *                 description: Address of the station
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *               connector_type:
 *                 type: string
 *                 enum: [AC, DC]
 *                 description: Type of connector
 *               status:
 *                 type: string
 *                 enum: [online, offline, maintenance]
 *                 description: Status of the station
 *     responses:
 *       200:
 *         description: Station updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 connector_type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Station not found
 *   delete:
 *     summary: Delete station by id
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     responses:
 *       204:
 *         description: Station deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Station not found
 */
/**
 * @swagger
 * /api/stations/{id}/charging-points:
 *   get:
 *     summary: Get all charging points for a specific station
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     responses:
 *       200:
 *         description: List of charging points for the station
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   stationId:
 *                     type: string
 *                   power_capacity:
 *                     type: number
 *                     description: Power capacity in kW
 *                   status:
 *                     type: string
 *                     enum: [available, in_use, maintenance]
 *                   create_at:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Station not found
 */
