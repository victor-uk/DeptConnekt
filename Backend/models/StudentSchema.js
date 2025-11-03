import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { checkYearIsValid } from "../helpers/checkValidYear.js";

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // hide in queries
    },
    matricNo: {
      type: String,
      required: [true, "Matric number is required"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["student", "studentAdmin"],
      default: "student",
    },
    admissionYear: {
        type: Number,
        required: [true, "Admission year is required"],
        validate: {
          validator: checkYearIsValid,
          message: (props) => `${props.value} is not a valid admission year`,
        },
      },
    profileImage: {
      type: String,
    },
    adviser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    }
  },
  { timestamps: true }
);

// Hash password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual full name
studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model("Student", studentSchema);
