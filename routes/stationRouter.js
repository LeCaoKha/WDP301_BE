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
router.post('/add-staff', authenticateToken, StationController.addStaffToStation);
router.post('/remove-staff', authenticateToken, StationController.removeStaffFromStation);
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
 *                   power_capacity:
 *                     type: number
 *                     description: Công suất trạm (kW)
 *                   price_per_kwh:
 *                     type: number
 *                     description: Giá điện (VND/kWh)
 *                   base_fee:
 *                     type: number
 *                     description: Phí cơ bản (VND)
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
 *               - power_capacity
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
 *               power_capacity:
 *                 type: number
 *                 description: Công suất của trạm (kW) - áp dụng cho tất cả charging points
 *                 example: 50
 *               price_per_kwh:
 *                 type: number
 *                 description: Giá điện của trạm (VND/kWh)
 *                 default: 3000
 *                 example: 3000
 *               base_fee:
 *                 type: number
 *                 description: Phí cơ bản mỗi lần sạc (VND)
 *                 default: 10000
 *                 example: 10000
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
 *                   enum: [AC, DC]
 *                 power_capacity:
 *                   type: number
 *                   description: Công suất trạm (kW)
 *                 price_per_kwh:
 *                   type: number
 *                   description: Giá điện (VND/kWh)
 *                 base_fee:
 *                   type: number
 *                   description: Phí cơ bản (VND)
 *                 status:
 *                   type: string
 *                   enum: [online, offline, maintenance]
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
 *                 power_capacity:
 *                   type: number
 *                   description: Công suất trạm (kW)
 *                 price_per_kwh:
 *                   type: number
 *                   description: Giá điện (VND/kWh)
 *                 base_fee:
 *                   type: number
 *                   description: Phí cơ bản (VND)
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
 *               power_capacity:
 *                 type: number
 *                 description: Công suất của trạm (kW)
 *               price_per_kwh:
 *                 type: number
 *                 description: Giá điện của trạm (VND/kWh)
 *               base_fee:
 *                 type: number
 *                 description: Phí cơ bản mỗi lần sạc (VND)
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
 *                   enum: [AC, DC]
 *                 power_capacity:
 *                   type: number
 *                   description: Công suất trạm (kW)
 *                 price_per_kwh:
 *                   type: number
 *                   description: Giá điện (VND/kWh)
 *                 base_fee:
 *                   type: number
 *                   description: Phí cơ bản (VND)
 *                 status:
 *                   type: string
 *                   enum: [online, offline, maintenance]
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
/**
 * @swagger
 * /api/stations/add-staff:
 *   post:
 *     summary: Gán staff vào station
 *     description: >
 *       Gán một hoặc nhiều staff accounts vào một station cụ thể.
 *       API này sẽ:
 *       1. Cập nhật field station_id của các Account staff
 *       2. Thêm các staff_ids vào field staff_id (array) của Station
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
 *               - station_id
 *               - staff_ids
 *             properties:
 *               station_id:
 *                 type: string
 *                 description: ID của station cần gán staff vào
 *                 example: "507f1f77bcf86cd799439011"
 *               staff_ids:
 *                 type: array
 *                 description: Mảng các ID của staff accounts cần gán vào station
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     responses:
 *       200:
 *         description: Gán staff vào station thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đã gán 2 staff vào station thành công"
 *                 station:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     staff_id:
 *                       type: array
 *                       description: "Danh sách staff IDs (populated với thông tin staff)"
 *                       items:
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
 *                             example: staff
 *                           status:
 *                             type: string
 *                 staffsCount:
 *                   type: integer
 *                   example: 2
 *                 staffs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                         example: staff
 *                       station_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Station reference (populated with station details)"
 *                       company_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Company reference (populated with company details)"
 *       400:
 *         description: Bad request (thiếu station_id hoặc staff_ids không hợp lệ)
 *       404:
 *         description: Station không tồn tại hoặc một số staff không tồn tại/không phải là staff
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/stations/remove-staff:
 *   post:
 *     summary: Xóa staff khỏi station
 *     description: >
 *       Xóa một hoặc nhiều staff accounts khỏi station.
 *       API này sẽ:
 *       1. Set station_id = null cho các Account staff
 *       2. Xóa các staff_ids khỏi field staff_id (array) của Station
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
 *               - station_id
 *               - staff_ids
 *             properties:
 *               station_id:
 *                 type: string
 *                 description: ID của station cần xóa staff
 *                 example: "507f1f77bcf86cd799439011"
 *               staff_ids:
 *                 type: array
 *                 description: Mảng các ID của staff accounts cần xóa khỏi station
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     responses:
 *       200:
 *         description: Xóa staff khỏi station thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đã xóa 2 staff khỏi station thành công"
 *                 station:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     staff_id:
 *                       type: array
 *                       description: "Danh sách staff IDs còn lại (populated với thông tin staff)"
 *                       items:
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
 *                             example: staff
 *                           status:
 *                             type: string
 *                 staffsCount:
 *                   type: integer
 *                   example: 2
 *                 staffs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                         example: staff
 *                       station_id:
 *                         type: null
 *                         description: "Station reference (sẽ là null sau khi xóa)"
 *                       company_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Company reference (populated with company details)"
 *       400:
 *         description: Bad request (thiếu station_id hoặc staff_ids không hợp lệ)
 *       404:
 *         description: Station không tồn tại hoặc một số staff không tồn tại/không phải là staff
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
