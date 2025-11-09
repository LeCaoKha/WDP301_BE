const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    plate_number: {
      type: String,
      unique: true,
      maxlength: 20,
      trim: true,
      required: true,
    },
    model: {
      type: String,
      maxlength: 50,
      trim: true,
      required: true,
    },
    // kWh
    batteryCapacity: { type: Number },
    vehicle_subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleSubscription",
      required: false,
    },
    // Soft Delete Fields
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index để query nhanh
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedReason: {
      type: String,
      default: null,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
