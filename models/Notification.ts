import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "host_approved",
      "host_rejected",
      "application_preapproved",
      "application_approved",
      "application_rejected",
      "property_approved",
      "property_rejected",
      "general",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);