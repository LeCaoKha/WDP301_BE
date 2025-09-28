const express = require('express');
const StationController = require('../controllers/stationController.js');
const router = express.Router();
router.post('/', StationController.createStation);
router.get('/', StationController.getStations);
router.get('/:id', StationController.getStationById);
router.put('/:id', StationController.updateStation);
router.delete('/:id', StationController.deleteStation);
module.exports = router;
