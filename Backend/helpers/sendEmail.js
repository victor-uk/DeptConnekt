import nodemailer from 'nodemailer'
import generateOTP from '../utils/generateOtp.js'
import TokenSchema from '../models/TokenSchema.js'
import { expiryDate } from '../config/defaults.js'

const host = process.env.NODE_ENV === "development" ? process.env.TEST_EMAIL_HOST : process.env.EMAIL_HOST
const port = process.env.NODE_ENV === "development" ? process.env.TEST_EMAIL_PORT : process.env.EMAIL_PORT
const user = process.env.NODE_ENV === "development" ? process.env.TEST_EMAIL_USER : process.env.EMAIL_USER
const password = process.env.NODE_ENV === "development" ? process.env.TEST_EMAIL_PASSWORD : process.env.EMAIL_PASSWORD

const transport = nodemailer.createTransport({
  host: host,
  port: port,
  auth: {
    user: user,
    pass: password
  }
})

export const emailConfirmationHelper = async (id, email) => {
  let otp = generateOTP()
  const mailOptions = {
    from: `DeptConnekt" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify otp',
    text: `Your otp is ${otp}`
  }
  await TokenSchema.create({
    userId: id,
    token: otp,
    expiresAt: expiryDate
  })
  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    console.error(err.message); // Human-readable message
    console.log(err.code);    // e.g., 'ECONNECTION', 'EAUTH'
    console.log(err.response); // SMTP server response
  }
}
