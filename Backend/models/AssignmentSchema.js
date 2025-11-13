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

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Assignment description is required"],
    },

    // Short preview
    preview: {
      type: String,
      maxlength: 300,
      default: "",
      trim: true,
    },

    attachments: [attachmentSchema],

    image: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      required: true,
    },
    createdByModel: {
      type: String,
      enum: ["Lecturer", "CourseAdviser"],
      required: true,
    },

    admissionYear: {
      type: [String],
      required: true,
      example: ["2021", "2022"],
    },

    deadline: {
      type: Date,
      required: [true, "Submission deadline is required"],
    },

    // Archiving fields
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },

    // TTL expiry for automatic deletion after archival
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// TTL index: MongoDB will remove docs once expiresAt passes
assignmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 🧩 Archive / Unarchive methods
assignmentSchema.methods.archive = async function () {
  this.archived = true;
  this.archivedAt = new Date();

  // 6 months (≈180 days) after archival
  const sixMonths = 180 * 24 * 60 * 60 * 1000;
  this.expiresAt = new Date(this.archivedAt.getTime() + sixMonths);

  await this.save();
};

assignmentSchema.methods.unarchive = async function () {
  this.archived = false;
  this.archivedAt = null;
  this.expiresAt = null; // Cancel TTL countdown
  await this.save();
};

// Virtual: time remaining before deadline
assignmentSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  const diff = Math.max(0, this.deadline - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
})

export default mongoose.model("Assignment", assignmentSchema);
