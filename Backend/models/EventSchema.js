import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    fileType: String,
    size: Number,
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
    },

    preview: {
      type: String,
      maxlength: 150,
      required: true,
      trim: true,
    },

    attachments: [attachmentSchema],

    image: {
      type: String,
      default: null,
    },

    // Created by Admin, Lecturer, or Course Adviser
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      required: true,
    },
    createdByModel: {
      type: String,
      enum: ["Admin", "Lecturer", "CourseAdviser"],
      required: true,
    },

    // Target audience (could be admission year or role-based)
    targetGroups: {
      type: [Number],
      default: [], // e.g., ["2021", "2022", "lecturer"]
    },

    // Date and time of the event
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },

    location: {
      type: String,
      required: false,
      default: "TBA",
      trim: true,
    },

    archived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// TTL for auto-cleanup after archive (6 months)
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Archive method — marks event as archived and sets TTL countdown (6 months)
 */
eventSchema.methods.archive = async function () {
  this.archived = true;
  this.archivedAt = new Date();

  // 6 months TTL
  const sixMonths = 180 * 24 * 60 * 60 * 1000;
  this.expiresAt = new Date(this.archivedAt.getTime() + sixMonths);

  await this.save();
  return this;
};

/**
 * Unarchive method — restores event and clears TTL
 */
eventSchema.methods.unarchive = async function () {
  this.archived = false;
  this.archivedAt = null;
  this.expiresAt = null;
  await this.save();
  return this;
};


/**
 * Virtual: Time remaining until the event starts
 */
eventSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  const diff = Math.max(0, this.eventDate - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
});

export default mongoose.model("Event", eventSchema);
