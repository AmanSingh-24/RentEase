import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Extended roles — "admin" added for control center access
  role: {
    type: String,
    enum: ["owner", "tenant", "pending", "admin"],
    required: true,
  },

  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },

  // ✅ Payment gatekeeper — true after deposit + first month rent paid
  isOnboarded: { type: Boolean, default: false },

  // ─── MARKETPLACE KYC FIELDS ───────────────────────────────────────────────
  // Controls whether an owner's properties can go live on the public marketplace
  verificationStatus: {
    type: String,
    enum: ["unboarded", "pending_verification", "verified", "rejected"],
    default: "unboarded",
  },
  rejectionReason: { type: String, default: "" },

  // Owner KYC details submitted during landlord onboarding
  kycDetails: {
    fullName: { type: String },
    phone: { type: String },
    idDocumentUrl: { type: String }, // Cloudinary URL — never exposed to public
    submittedAt: { type: Date },
  },
  // ─────────────────────────────────────────────────────────────────────────

  // ─── HOST STATUS STATE MACHINE ────────────────────────────────────────────
  // Tracks a user's host application journey independent of their role.
  // not_applied → pending → approved | rejected → (resubmit) → pending
  hostStatus: {
    type: String,
    enum: ["not_applied", "pending", "approved", "rejected"],
    default: "not_applied",
  },
  // True on the FIRST login after admin approval — triggers the congrats modal.
  // Set to false after user dismisses the modal.
  firstHostLogin: { type: Boolean, default: false },
  // ─────────────────────────────────────────────────────────────────────────

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);