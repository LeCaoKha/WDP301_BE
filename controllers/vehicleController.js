const Vehicle = require("../models/Vehicle");
const Account = require("../models/Account");

// Create Vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { accountId, plateNumber, brand, model, batteryCapacity } = req.body;

    // Check if accountId exists
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(400).json({ message: "Account not found" });
    }

    const exists = await Vehicle.findOne({ plateNumber });
    if (exists) {
      return res.status(400).json({ message: "Plate number already exists" });
    }
    const vehicle = await Vehicle.create({
      accountId,
      plateNumber,
      brand,
      model,
      batteryCapacity,
    });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate(
      "accountId",
      "username email role status"
    );
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Vehicle by id
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id).populate(
      "accountId",
      "username email role status"
    );
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Vehicle by id
exports.updateVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, plateNumber, brand, model, batteryCapacity } = req.body;

    // Check if accountId exists (if provided)
    if (accountId) {
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(400).json({ message: "Account not found" });
      }
    }

    if (plateNumber) {
      const conflict = await Vehicle.findOne({
        _id: { $ne: id },
        plateNumber,
      });
      if (conflict) {
        return res.status(400).json({ message: "Plate number already in use" });
      }
    }

    const updated = await Vehicle.findByIdAndUpdate(
      id,
      { accountId, plateNumber, brand, model, batteryCapacity },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Vehicle by id
exports.deleteVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
