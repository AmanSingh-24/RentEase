import mongoose from "mongoose";

const InspectionSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["move-in", "move-out"], default: "move-in" },
  status: { 
    type: String, 
    enum: ["pending", "verified", "rejected", "completed"], 
    default: "pending" 
  },
  
  // ✅ NEW: Itemized Evidence Report
  report: [
    {
      roomName: String,
      itemName: String,
      condition: { type: String, enum: ["Good", "Fair", "Poor", "N/A"] },
      photoUrl: String,
      tenantComment: String,
      isCameraCaptured: { type: Boolean, default: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  
  ownerFeedback: String,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Inspection || mongoose.model("Inspection", InspectionSchema);