import nodemailer from 'nodemailer'
import generateOTP from '../utils/generateOtp.js'
import TokenSchema from '../models/TokenSchema.js'
import { expiryDate } from '../config/defaults.js'

const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '7ddc82dead69ee',
    pass: 'a872cabffb460e'
  }
})

export const emailConfirmationHelper = async id => {
  let otp = generateOTP()
  const mailOptions = {
    from: '"DeptConnect" <no-reply@deptconnect.com>',
    to: 'student@example.com',
    subject: 'Verify otp',
    text: `Your otp is ${otp}`
  }
  await TokenSchema.create({
    userId: id,
    token: otp,
    expiresAt: expiryDate
  })
  await transport.sendMail(mailOptions)
}
