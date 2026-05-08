const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true,
      default: 0
    },
    longitude: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      required: true,
      default: "Active",
      trim: true
    },
    alertType: {
      type: String,
      required: true,
      default: "SOS",
      trim: true
    },
    safeRadiusMeters: {
      type: Number,
      default: 500
    },
    safeCenterLatitude: {
      type: Number,
      default: 0
    },
    safeCenterLongitude: {
      type: Number,
      default: 0
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("Alert", alertSchema);
