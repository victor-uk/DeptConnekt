import jwt from 'jsonwebtoken'

export const generateJwt = async (id, role) => {
  return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES})
}