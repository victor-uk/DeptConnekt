import { BrevoClient } from '@getbrevo/brevo'
import generateOTP from '../utils/generateOtp.js'
import TokenSchema from '../models/TokenSchema.js'
import { expiryDate } from '../config/defaults.js'
import { InternalServerError } from '../utils/Error.js'

let expiryDateInNL = `10 minutes`

export const emailConfirmationHelper = async (id, email, name) => {
  const brevo = new BrevoClient({ apiKey: process.env.EMAIL_API_KEY })
  let otp = generateOTP()
  const mailOptions = {
    subject: `DeptConnekt: Account Verification for ${name}`,
    htmlContent: `Hey ${name}, your otp is ${otp}. It expires in ${expiryDateInNL}`,
    sender: { name: 'DeptConnekt', email: `${process.env.EMAIL_FROM}` },
    to: [{ email: email, name: name }],
  }

  await TokenSchema.create({
    userId: id,
    token: otp,
    expiresAt: expiryDate
  })
  try {
    await brevo.transactionalEmails.sendTransacEmail(mailOptions);
  } catch (err) {
    throw new InternalServerError(err)
  }
}
