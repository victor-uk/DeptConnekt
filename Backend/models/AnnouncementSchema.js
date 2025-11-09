import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["general", "academic", "event", "alert", "other"],
      default: "general",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    image: {
      publicId: String,
      url: String,
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],

    // === Lifecycle management ===
    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: Date,

    expiresAt: Date // for TTL-based deletion
  },
  {
    timestamps: true,
  }
);

// TTL index for expired documents
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Archive announcement (soft removal)
 */
announcementSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();

  // Optionally auto-delete after 6 months
  const sixMonths = 1000 * 60 * 60 * 24 * 30 * 6;
  this.expiresAt = new Date(Date.now() + sixMonths);

  await this.save();
};

/**
 * Unarchive announcement (restore)
 */
announcementSchema.methods.unarchive = async function () {
  this.isArchived = false;
  this.archivedAt = null;
  this.expiresAt = null; // clear TTL so Mongo doesn't auto-delete it
  await this.save();
};

export default mongoose.model("Announcement", announcementSchema);
