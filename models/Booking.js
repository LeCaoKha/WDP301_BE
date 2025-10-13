const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      description: "Reference to the user who made the booking",
    },
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      description: "Reference to the charging station",
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      description: "Reference to the vehicle",
    },
    chargingPoint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChargingPoint",
      required: true,
      description: "Reference to the charging point",
    },
    start_time: {
      type: Date,
      required: true,
      description: "Start time of the booking",
    },
    end_time: {
      type: Date,
      required: true,
      description: "End time of the booking",
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending",
      description: "Status of the booking",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for better query performance
bookingSchema.index({ user_id: 1, status: 1 });
bookingSchema.index({ station_id: 1, status: 1 });
bookingSchema.index({ vehicle_id: 1, status: 1 });
bookingSchema.index({ chargingPoint_id: 1, status: 1 });
bookingSchema.index({ start_time: 1, end_time: 1 });
bookingSchema.index({ status: 1 });

// Compound index for active bookings
bookingSchema.index({
  station_id: 1,
  chargingPoint_id: 1,
  status: 1,
  start_time: 1,
  end_time: 1,
});

// Virtual for checking if booking is currently active
bookingSchema.virtual("is_currently_active").get(function () {
  const now = new Date();
  return (
    this.status === "active" && this.start_time <= now && this.end_time >= now
  );
});

// Virtual for checking if booking is expired
bookingSchema.virtual("is_expired").get(function () {
  const now = new Date();
  return (
    this.end_time < now &&
    this.status !== "completed" &&
    this.status !== "cancelled"
  );
});

// Method to check if booking time conflicts with another booking
bookingSchema.methods.hasTimeConflict = function (otherBooking) {
  return (
    this.chargingPoint_id.toString() ===
      otherBooking.chargingPoint_id.toString() &&
    this.status !== "cancelled" &&
    otherBooking.status !== "cancelled" &&
    this._id.toString() !== otherBooking._id.toString() &&
    this.start_time < otherBooking.end_time &&
    this.end_time > otherBooking.start_time
  );
};

// Method to check if booking is in the past
bookingSchema.methods.isInPast = function () {
  const now = new Date();
  return this.start_time < now;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const timeUntilStart = this.start_time.getTime() - now.getTime();
  const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

  return (
    this.status === "pending" ||
    this.status === "confirmed" ||
    (this.status === "active" && hoursUntilStart > 0)
  );
};

module.exports = mongoose.model("Booking", bookingSchema);
