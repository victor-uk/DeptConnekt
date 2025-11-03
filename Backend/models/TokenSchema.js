import mongoose from "mongoose";
import bcrypt from 'bcrypt'

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// Automatically remove expired tokens (if you use TTL index)
//.index is for the schema as .createIndex is for the model
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.pre('save', async function (next) {
  if (!this.isModified('token')) return next()
  this.token = await bcrypt.hash(this.token, 10)
  next()
})
tokenSchema.methods.compareToken = async function (enteredToken) {
  return await bcrypt.compare(enteredToken, this.token);
}

const TokenSchema = mongoose.model("Token", tokenSchema);
export default TokenSchema;
