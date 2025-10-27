const Vehicle = require("../models/Vehicle");
const Account = require("../models/Account");
const Company = require("../models/Company");
const VehicleSubscription = require("../models/VehicleSubscription");

// Create Vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { user_id, company_id, plate_number, model, batteryCapacity } =
      req.body;

    // Check if user_id exists
    const user = await Account.findById(user_id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if company_id exists (only if provided and not empty)
    if (company_id && company_id.trim() !== "") {
      const company = await Company.findById(company_id);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
    }

    // Validate plate_number
    if (!plate_number || plate_number.trim() === "") {
      return res.status(400).json({ message: "Plate number is required" });
    }

    const exists = await Vehicle.findOne({ plate_number });
    if (exists) {
      return res.status(400).json({ message: "Plate number already exists" });
    }
    const vehicle = await Vehicle.create({
      user_id,
      company_id: company_id && company_id.trim() !== "" ? company_id : null,
      plate_number,
      model,
      batteryCapacity,
      vehicle_subscription_id: null,
    });

    // Populate the response
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("user_id", "username email role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      });

    res.status(201).json(populatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("user_id", "username email role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Vehicle by id
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .populate("user_id", "username email role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      });
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
    const { user_id, company_id, plate_number, model, batteryCapacity } =
      req.body;

    // Check if vehicle exists
    const existingVehicle = await Vehicle.findById(id);
    if (!existingVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if user_id exists
    const user = await Account.findById(user_id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if company_id exists (only if provided and not empty)
    if (company_id && company_id.trim() !== "") {
      const company = await Company.findById(company_id);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
    }

    // Validate plate_number
    if (!plate_number || plate_number.trim() === "") {
      return res.status(400).json({ message: "Plate number is required" });
    }

    // Ensure plate number is unique
    const conflict = await Vehicle.findOne({
      _id: { $ne: id },
      plate_number,
    });
    if (conflict) {
      return res.status(400).json({ message: "Plate number already exists" });
    }

    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        user_id,
        company_id: company_id && company_id.trim() !== "" ? company_id : null,
        plate_number,
        model,
        batteryCapacity,
      },
      { new: true, runValidators: true }
    )
      .populate("user_id", "username email role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      });

    res.status(200).json(updatedVehicle);
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

// Get my vehicles (current user's vehicles)
exports.getMyVehicles = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.accountId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await Vehicle.find({ user_id: userId })
      .populate("user_id", "username email role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments({ user_id: userId });

    res.status(200).json({
      vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
