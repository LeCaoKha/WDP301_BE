const express = require('express');
const chargingController = require('../controllers/chargingPointController');
const router = express.Router();

router.post('/', chargingController.createChargingPoint);
router.get('/', chargingController.getChargingPoints);
router.get('/:id', chargingController.getChargingPointById);
router.put('/:id', chargingController.updateChargingPoint);
router.delete('/:id', chargingController.deleteChargingPoint);
module.exports = router;
