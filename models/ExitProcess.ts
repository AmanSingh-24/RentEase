import mongoose from "mongoose";

const ExitProcessSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  noticeDate: { type: Date, default: Date.now },
  moveOutDate: { type: Date, required: true },
  reason: { type: String },

  status: { 
    type: String, 
    enum: [
      "notice_served", 
      "notice_rescheduled", 
      "notice_accepted",
      "photos_submitted", 
      "physical_inspection_required", 
      "physical_inspection_done", 
      "inspection_completed", 
      "settled", 
      "disputed", // ✅ NEW STATUS
      "archived"
    ],
    default: "notice_served"
  },

  // ✅ Store the tenant's dispute reason
  tenantDisputeComment: { type: String, default: "" },

  moveOutPhotos: [{ area: String, url: String, comment: String, condition: String }],

  inspectionDate: Date,
  inspectorName: String,
  inspectorContact: String,
  physicalAuditNotes: String,

  deductions: [{ item: String, amount: Number, reason: String }],
  finalRefundAmount: { type: Number, default: 0 },
  isTenantSatisfied: { type: Boolean, default: false }, 
  
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.ExitProcess || mongoose.model("ExitProcess", ExitProcessSchema);