const ChargingPoint = require('../models/ChargingPoint');
exports.createChargingPoint = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.create(req.body);
    res.status(201).json(chargingPoint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get all charging points
exports.getChargingPoints = async (req, res) => {
  try {
    const chargingPoints = await ChargingPoint.find().populate('stationId');
    res.status(200).json(chargingPoints);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getChargingPointById = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.findById(req.params.id).populate(
      'stationId'
    );
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }
    res.status(200).json(chargingPoint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Update a charging point
exports.updateChargingPoint = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }
    res.status(200).json(chargingPoint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a charging point
exports.deleteChargingPoint = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.findByIdAndDelete(req.params.id);
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
