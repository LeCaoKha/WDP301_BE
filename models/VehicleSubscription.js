const mongoose = require("mongoose");

const vehicleSubscriptionSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      description: "Reference to the vehicle",
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      description: "Reference to the subscription plan",
    },
    start_date: {
      type: Date,
      required: true,
      description: "Start date of the subscription",
    },
    end_date: {
      type: Date,
      required: true,
      description: "End date of the subscription",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "expired", "cancelled", "suspended"],
      default: "active",
      description: "Status of the vehicle subscription",
    },
    // Additional fields for better management
    auto_renew: {
      type: Boolean,
      default: false,
      description: "Whether the subscription should auto-renew",
    },
    payment_status: {
      type: String,
      enum: ["paid", "pending", "failed", "refunded"],
      default: "pending",
      description: "Payment status of the subscription",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for better query performance
vehicleSubscriptionSchema.index({ vehicle_id: 1, status: 1 });
vehicleSubscriptionSchema.index({ subscription_id: 1 });
vehicleSubscriptionSchema.index({ start_date: 1, end_date: 1 });
vehicleSubscriptionSchema.index({ status: 1 });

// Compound index for active subscriptions
vehicleSubscriptionSchema.index({
  vehicle_id: 1,
  status: 1,
  start_date: 1,
  end_date: 1,
});

// Virtual for checking if subscription is currently active
vehicleSubscriptionSchema.virtual("is_currently_active").get(function () {
  const now = new Date();
  return (
    this.status === "active" && this.start_date <= now && this.end_date >= now
  );
});

// Method to check if subscription is expired
vehicleSubscriptionSchema.methods.isExpired = function () {
  const now = new Date();
  return this.end_date < now;
};

// Method to extend subscription
vehicleSubscriptionSchema.methods.extendSubscription = function (days) {
  this.end_date = new Date(
    this.end_date.getTime() + days * 24 * 60 * 60 * 1000
  );
  return this.save();
};

module.exports = mongoose.model(
  "VehicleSubscription",
  vehicleSubscriptionSchema
);
