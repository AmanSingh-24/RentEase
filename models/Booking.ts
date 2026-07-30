import mongoose from "mongoose";

/**
 * Booking Schema
 *
 * Lifecycle:
 *   pending          → Tenant sent a booking request
 *   pending_payment  → Owner assigned the property; tenant must now pay + sign
 *   rejected         → Owner rejected the request (property stays vacant)
 *
 * The property.status mirrors the booking journey:
 *   vacant → pending_payment → waiting_payment_approval → occupied
 */
const BookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
    index: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "pending_payment", "rejected", "active"],
    default: "pending",
  },
  tenantContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
