const express = require('express');
const chargingController = require('../controllers/chargingPointController');
const router = express.Router();

router.post('/', chargingController.createChargingPoint);
router.get('/', chargingController.getChargingPoints);
router.get('/:id', chargingController.getChargingPointById);
router.put('/:id', chargingController.updateChargingPoint);
router.delete('/:id', chargingController.deleteChargingPoint);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ChargingPoint
 *   description: Charging point management
 */
/**
 * @swagger
 * /api/charging-point:
 *   get:
 *     summary: Get all charging points
 *     tags: [ChargingPoint]
 *     responses:
 *       200:
 *         description: List of charging points
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       connector_type:
 *                         type: string
 *                       power_capacity:
 *                         type: number
 *                         description: Công suất trạm (kW)
 *                       status:
 *                         type: string
 *                   type:
 *                     type: string
 *                     enum: [online, offline]
 *                     description: Type of charging point
 *                   status:
 *                     type: string
 *                     enum: [available, in_use, maintenance]
 *                   create_at:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request
 *   post:
 *     summary: Create a new charging point
 *     tags: [ChargingPoint]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stationId
 *               - type
 *             properties:
 *               stationId:
 *                 type: string
 *                 description: ID của trạm sạc (power_capacity lấy từ station)
 *                 example: "507f1f77bcf86cd799439011"
 *               type:
 *                 type: string
 *                 enum: [online, offline]
 *                 description: "online: cho booking qua app, offline: sử dụng trực tiếp"
 *                 example: "online"
 *               status:
 *                 type: string
 *                 enum: [available, in_use, maintenance]
 *                 default: available
 *                 description: Status of the charging point
 *                 example: "available"
 *     responses:
 *       201:
 *         description: Charging point created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chargingPoint:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     stationId:
 *                       type: string
 *                     station_name:
 *                       type: string
 *                     power_capacity:
 *                       type: number
 *                       description: Công suất từ station (kW)
 *                     type:
 *                       type: string
 *                       enum: [online, offline]
 *                     status:
 *                       type: string
 *                     create_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 */
/**
 * @swagger
 * /api/charging-point/{id}:
 *   get:
 *     summary: Get charging point by id
 *     tags: [ChargingPoint]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging point ID
 *     responses:
 *       200:
 *         description: Charging point details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 stationId:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     connector_type:
 *                       type: string
 *                     power_capacity:
 *                       type: number
 *                       description: Công suất trạm (kW)
 *                     status:
 *                       type: string
 *                 type:
 *                   type: string
 *                   enum: [online, offline]
 *                 status:
 *                   type: string
 *                   enum: [available, in_use, maintenance]
 *                 create_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       404:
 *         description: Charging point not found
 *   put:
 *     summary: Update charging point by id
 *     tags: [ChargingPoint]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging point ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: string
 *                 description: ID of the station (cannot change if in_use)
 *               type:
 *                 type: string
 *                 enum: [online, offline]
 *                 description: Type of charging point (cannot change if in_use)
 *               status:
 *                 type: string
 *                 enum: [available, in_use, maintenance]
 *                 description: Status of the charging point
 *     responses:
 *       200:
 *         description: Charging point updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 stationId:
 *                   type: string
 *                 power_capacity:
 *                   type: number
 *                 status:
 *                   type: string
 *                 create_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Charging point not found
 *   delete:
 *     summary: Delete charging point by id
 *     tags: [ChargingPoint]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Charging point ID
 *     responses:
 *       204:
 *         description: Charging point deleted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Charging point not found
 */