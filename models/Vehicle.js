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
      required: true,
    },
    license_plate: {
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
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
