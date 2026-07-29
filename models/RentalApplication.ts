import mongoose from "mongoose";

/**
 * RentalApplication
 *
 * Tracks the full lifecycle of a tenant's interest in a listed property:
 *
 * FLOW:
 *   submitted → kyc_requested → pre_approved → approved
 *                                             ↘ rejected / withdrawn
 */
const RentalApplicationSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Step 1 — Details submitted by the tenant on initial interest form
    applicantDetails: {
      fullName: { type: String },
      phone: { type: String },
      monthlyIncome: { type: Number },
      occupantsCount: { type: Number },
      targetMoveInDate: { type: Date },
      notes: { type: String },
    },

    // Application lifecycle status
    status: {
      type: String,
      enum: [
        "submitted",    // Tenant expressed interest
        "kyc_requested",// Owner pre-approved — tenant must now upload Govt ID
        "pre_approved", // Tenant uploaded Govt ID — owner can finalize lease
        "approved",     // Owner finalized — tenant linked to property
        "rejected",     // Owner rejected application
        "withdrawn",    // Tenant withdrew application
      ],
      default: "submitted",
    },

    // Step 3 — Tenant's Govt ID (uploaded ONLY after owner pre-approves)
    tenantKycUrl: { type: String, default: "" },

    // Optional rejection reason from owner
    rejectionReason: { type: String, default: "" },
  },
  {
    // Adds automatic createdAt + updatedAt fields
    timestamps: true,
  }
);

// Index for efficient lookups by property and tenant
RentalApplicationSchema.index({ propertyId: 1, tenantId: 1 });
RentalApplicationSchema.index({ ownerId: 1, status: 1 });

export default mongoose.models.RentalApplication ||
  mongoose.model("RentalApplication", RentalApplicationSchema);
