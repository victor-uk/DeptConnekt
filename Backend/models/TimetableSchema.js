import mongoose from "mongoose";
import { ResourceNotFoundError } from "../utils/Error.js";


const classPeriodSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    venue: { type: String, required: true },

    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true },   // "10:00"
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday", // hybrid extension
        "Sunday",   // hybrid extension
      ],
    },
    classes: {
      type: [classPeriodSchema],
      default: [],
    },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    admissionYear: { type: Number, required: true },
    semester: { type: String, required: true, enum: ["First", "Second"]},
    level: {
      type: String,
      required: true,
      enum: ["100", "200", "300", "400", "500"]
    },


    // Who created the timetable
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

    // Hybrid structure: flexible days, but defaults to Mon–Fri
    weekDays: {
      type: [daySchema],
      default: [
        { day: "Monday", classes: [] },
        { day: "Tuesday", classes: [] },
        { day: "Wednesday", classes: [] },
        { day: "Thursday", classes: [] },
        { day: "Friday", classes: [] },
      ],
      validate: {
        validator: function (value) {
          const days = value.map(v => v.day);
          return new Set(days).size === days.length;
        },
        message: "Duplicate days detected in timetable",
      }
    },

    archived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// TTL after 6 months of archival
timetableSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

timetableSchema.methods.archive = async function () {
  this.archived = true;
  this.archivedAt = new Date();
  const sixMonths = 180 * 24 * 60 * 60 * 1000;
  this.expiresAt = new Date(this.archivedAt.getTime() + sixMonths);
  await this.save();
  return this;
};

timetableSchema.methods.unarchive = async function () {
  this.archived = false;
  this.archivedAt = null;
  this.expiresAt = null;
  await this.save();
  return this;
};

// Total number of class periods in the timetable
timetableSchema.virtual("totalClasses").get(function () {
  return this.weekDays.reduce(
    (count, d) => count + d.classes.length,
    0
  );
});

// timetableSchema.methods.addDay = async function (dayName) {
//   const exists = this.weekDays.some(d => d.day === dayName);
//   if (exists) {
//     throw new AlrreadyExistsError(`Day '${dayName}' already exists in this timetable.`);
//   }

//   this.weekDays.push({ day: dayName, classes: [] });
//   await this.save();
//   return this;
// }

timetableSchema.methods.addClassToDay = async function (dayName, classData) {
  const day = this.weekDays.find(d => d.day === dayName);
  if (!day) {
    throw new ResourceNotFoundError(`Cannot add class. Day '${dayName}' does not exist.`);
  }

  day.classes.push(classData);
  await this.save();
  return this;
};

timetableSchema.methods.removeClassFromDay = async function (dayName, courseCode) {
  const day = this.weekDays.find(d => d.day === dayName);
  if (!day) {
    throw new ResourceNotFoundError(`Day '${dayName}' does not exist.`);
  }

  const before = day.classes.length;

  day.classes = day.classes.filter(c => c.courseCode !== courseCode);

  if (day.classes.length === before) {
    throw new ResourceNotFoundError(`Class '${courseCode}' not found in '${dayName}'.`);
  }

  await this.save();
  return this;
};



export default mongoose.model("Timetable", timetableSchema);
