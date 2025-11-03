import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { checkYearIsValid } from '../helpers/checkValidYear.js'

const lecturerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // hide in queries by default
    },
    lecturerID: {
      type: String,
      required: [true, 'Lecturer ID is required'],
      unique: true
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['lecturer', 'courseAdviser'],
      default: 'lecturer'
    },
    year: {
      type: Number,
      validate: {
        validator: checkYearIsValid,
        message: props => `${props.value} is not a valid admission year`
      },
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
)

// Hash password before saving
lecturerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Compare entered password with hashed one
lecturerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Virtual full name (optional)
lecturerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

export default mongoose.model('Lecturer', lecturerSchema)
