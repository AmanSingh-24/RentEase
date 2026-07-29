import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  address: { type: String, required: true },

  // ✅ STRUCTURE: The Room-by-Item Blueprint (for the Digital Witness inspection)
  structure: [
    {
      roomName: { type: String, required: true },
      items: [
        {
          itemName: { type: String, required: true },
          description: { type: String },
          baselineCondition: {
            type: String,
            enum: ["Good", "Fair", "Poor", "N/A"],
            default: "Good",
          },
        },
      ],
    },
  ],

  // ✅ FINTECH — Rent & Deposit
  rentAmount: { type: Number, default: 15000 },
  depositAmount: { type: Number, default: 45000 },
  leaseStartDate: { type: Date, default: Date.now },
  billingDay: { type: Number, default: 1 },

  maintenanceRules: {
    gracePeriodDays: { type: Number, default: 7 },
    repairThreshold: { type: Number, default: 500 },
  },
  exitPolicy: {
    lockInMonths: { type: Number, default: 11 },
    noticePeriodDays: { type: Number, default: 30 },
  },

  agreement: {
    isSignedByOwner: { type: Boolean, default: false },
    isSignedByTenant: { type: Boolean, default: false },
    signedPdfUrl: { type: String },
    blockchainHash: { type: String },
    signedAt: { type: Date },
  },

  // Operational tenancy status (used internally by the tenancy workflow)
  status: {
    type: String,
    enum: ["vacant", "occupied", "under_notice"],
    default: "vacant",
  },

  activeExitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExitProcess",
    default: null,
  },

  pastTenants: [
    {
      tenantId: mongoose.Schema.Types.ObjectId,
      name: String,
      email: String,
      movedOutAt: { type: Date, default: Date.now },
    },
  ],

  // ─── MARKETPLACE LISTING FIELDS ───────────────────────────────────────────
  // Controls public marketplace visibility — separate from internal `status`
  listingStatus: {
    type: String,
    enum: [
      "draft",             // Owner created but not submitted for review
      "pending_approval",  // Submitted — awaiting admin deed verification
      "active_marketplace",// Admin approved — visible on /properties
      "occupied",          // Tenant leased — auto-removed from marketplace
      "unlisted",          // Owner manually removed or admin delisted
      "rejected",          // Admin rejected the deed/listing
    ],
    default: "draft",
  },
  rejectionReason: { type: String, default: "" },

  // Admin-verified ownership proof (Property Tax Receipt / Sale Deed)
  ownershipProofUrl: { type: String },

  // Public-facing listing images (Cloudinary URLs, shown in marketplace)
  listingImages: [{ type: String }],

  // Location fields — indexed for efficient search
  city: { type: String, index: true },
  state: { type: String },
  pincode: { type: String },

  // Property classification
  bhk: { type: Number }, // 1, 2, 3, 4+
  furnishing: {
    type: String,
    enum: ["unfurnished", "semi_furnished", "fully_furnished"],
  },
  amenities: [{ type: String }], // e.g. ["WiFi", "Parking", "Generator"]
  description: { type: String }, // Listing description for marketplace

  // ─────────────────────────────────────────────────────────────────────────

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);