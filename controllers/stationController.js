const Station = require('../models/Station')

// Create a new station
exports.createStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);
    res.status(201).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get all stations
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json(stations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get a station by ID
exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.status(200).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Update a station
exports.updateStation = async (req, res) => {
    try {
        const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.status(200).json(station);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
//Delete a station
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id); 
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};