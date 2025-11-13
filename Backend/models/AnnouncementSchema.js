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

    preview: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      enum: ["general", "academic", "event", "alert", "other"],
      default: "general",
    },

    admissionYear: {
      type: [String],
      required: true,
      example: ["2021", "2022"] // metadata; doesnt affect logic,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "onModel",
    },

    onModel: {
      type: String,
      required: true,
      enum: ["Lecturer", "Student"],
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
announcementSchema.index({ })

/**
 * Archive announcement (soft removal)
 */
announcementSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();

  // Optionally auto-delete after 6 months
  const sixMonths = 1000 * 60 * 60 * 24 * 30 * 6;
  this.expiresAt = new Date(this.archivedAt.getTime() + sixMonths);

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
