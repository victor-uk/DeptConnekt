import request from 'supertest';
import app from '../../config/app.js';
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js';
import LecturerSchema from '../../models/LecturerSchema.js';
import StudentSchema from '../../models/StudentSchema.js';
import TokenSchema from '../../models/TokenSchema.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import { expiryDate } from '../../config/defaults.js';

// Set test JWT secret if not already set (needed for module-level token generation)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

describe('Auth Module', () => {
  beforeAll(async () => {
    await connectDB() 
  })

  afterAll(async () => {
    await closeDB()
  })

  afterEach(async () => {
    await clearDB()
  })

  // 1. Register
  describe('POST /api/v1/auth/register/lecturer', () => {
    const lecturerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      repeatPassword: 'password123',
      lecturerID: 'LEC123'
    }

    it('should register a lecturer successfully and generate an OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/lecturer')
        .send(lecturerData)

      const lecturer = await LecturerSchema.findOne({ email: lecturerData.email })
      expect(res.statusCode).toBe(202)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('you will receive an OTP')
      expect(lecturer).not.toBeNull()
    })

    it('should reject an already-registered email but return a generic 202 message', async () => {
      await LecturerSchema.create(lecturerData)

      const res = await request(app)
        .post('/api/v1/auth/register/lecturer')
        .send(lecturerData)

      expect(res.statusCode).toBe(202)
      expect(res.body.message).toContain('you will receive an OTP')
    })

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/lecturer')
        .send({ ...lecturerData, email: 'invalid-email' })

      expect(res.statusCode).toBe(400)
    })

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/lecturer')
        .send({ ...lecturerData, password: '123' })

      expect(res.statusCode).toBe(400)
    })

    it('should reject missing fields', async () => {
      const { firstName, ...rest } = lecturerData
      const res = await request(app)
        .post('/api/v1/auth/register/lecturer')
        .send(rest)

      expect(res.statusCode).toBe(400)
    })
  })

  // 2. Verify OTP
  describe('POST /api/v1/auth/verify-otp/:id', () => {
    const userId = new mongoose.Types.ObjectId()
    const otp = '123456'

    it('should verify OTP successfully and return a short-lived JWT', async () => {
      const token = await TokenSchema.create({
        userId,
        token: otp, // In a real scenario, this would be hashed.
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      })

      const res = await request(app)
        .post(`/api/v1/auth/verify-otp/${userId}`)
        .send({ otp })

      const usedToken = await TokenSchema.findById(token._id)
      expect(res.statusCode).toBe(202)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('token')
      expect(usedToken.used).toBe(true)
    })
    // Note: Testing incorrect OTP requires a hash comparison mock, which is complex for integration.
    // This is better suited for a unit test on the TokenSchema model itself.

    it('should reject already-used OTP', async () => {
      await TokenSchema.create({ userId, token: otp, used: true, expiresAt: expiryDate })

      const res = await request(app)
        .post(`/api/v1/auth/verify-otp/${userId}`)
        .send({ otp })

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe("Token is either invalid or already used")
    })

    it('should reject if token does not exist', async () => {
      const res = await request(app)
        .post(`/api/v1/auth/verify-otp/${userId}`)
        .send({ otp })

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Token is either invalid or already used')
    })
  })

  // 3. Login
  describe('POST /api/v1/auth/login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should log in a student with valid credentials and return a JWT', async () => {
      const student = await StudentSchema.create({
        email: loginCredentials.email,
        password: loginCredentials.password,
        firstName: 'Test',
        lastName: 'Student',
        matricNo: '12345',
        admissionYear: 2021
      })

      const res = await request(app)
        .post('/api/v1/auth/login?role=student')
        .send(loginCredentials)

      expect(res.statusCode).toBe(202)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('token')
      console.log(res.body.data);
      
      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET)
      expect(decoded.id).toBe(student.id)
      expect(decoded.role).toBe('student')
    })

    it('should log in a lecturer with valid credentials', async () => {
      await LecturerSchema.create({
        email: loginCredentials.email,
        password: loginCredentials.password,
        firstName: 'Test',
        lastName: 'Lecturer',
        lecturerID: 'LEC456'
      })

      const res = await request(app)
        .post('/api/v1/auth/login?role=lecturer')
        .send(loginCredentials)

      expect(res.statusCode).toBe(202)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('token')
    })

    it('should reject incorrect password', async () => {
      await StudentSchema.create({
        email: loginCredentials.email,
        password: 'correctPassword',
        firstName: 'Test',
        lastName: 'Student',
        matricNo: '12345',
        admissionYear: 2021
      })

      const res = await request(app)
        .post('/api/v1/auth/login?role=student')
        .send({ ...loginCredentials, password: 'wrongPassword' })

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Invalid email or password')
    })

    it('should reject non-existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login?role=student')
        .send(loginCredentials)

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Invalid email or password')
    })

    it('should return 403 upon missing or invalid role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toContain('A valid role (lecturer or student) is required')

      const res2 = await request(app)
        .post('/api/v1/auth/login?role=admin')
        .send(loginCredentials)
      expect(res2.statusCode).toBe(403)
    })
  })

  // 4. Forgot Password
  describe('POST /api/v1/auth/reset-password', () => {
    const email = 'user@example.com'

    it('should send OTP to email for an existing user', async () => {
      const student = await StudentSchema.create({
        email,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        matricNo: '12345',
        admissionYear: 2021
      })
      const res = await request(app)
        .post('/api/v1/auth/reset-password?role=student')
        .send({ email })

      expect(res.statusCode).toBe(202)
      expect(res.body.message).toContain('a password reset OTP will be sent')
    })
    it('should return a generic message for a non-existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password?role=student')
        .send({ email })

      expect(res.statusCode).toBe(202)
      expect(res.body.message).toContain('a password reset OTP will be sent')
    })
  })
  // 5. Reset Password (Change Password)
  describe('POST /api/v1/auth/change-password/:id', () => {
    const userId = new mongoose.Types.ObjectId()
    const newPassword = 'newPassword123'
    const validToken = jwt.sign({ id: userId, tokenUser: userId }, process.env.JWT_SECRET, { expiresIn: '10m' })

    it('should reset password successfully', async () => {
      const user = await StudentSchema.create({
        _id: userId, // Using a predictable ID
        email: 'test@test.com',
        password: 'oldPassword',
        firstName: 'Test',
        lastName: 'User',
        matricNo: '12345',
        admissionYear: 2021
      })

      const res = await request(app)
        .post(`/api/v1/auth/change-password/${userId}?role=student`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ password: newPassword })
      const updatedUser = await StudentSchema.findById(user._id).select('+password')

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Password has been reset successfully')
      expect(await updatedUser.comparePassword(newPassword)).toBe(true)
    })

    it('should reject if token is invalid or expired', async () => {
        const expiredToken = jwt.sign({ id: userId, tokenUser: userId }, process.env.JWT_SECRET, { expiresIn: '-1s' });
        const res = await request(app)
            .post(`/api/v1/auth/change-password/${userId}?role=student`)
            .set('Authorization', `Bearer ${expiredToken}`)
            .send({ password: newPassword });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Token expired');
    });

    it('should reject if tokenUser does not match params.id', async () => {
        const mismatchedToken = jwt.sign({ id: 'anotherId', tokenUser: 'anotherId' }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const res = await request(app)
            .post(`/api/v1/auth/change-password/${userId}?role=student`)
            .set('Authorization', `Bearer ${mismatchedToken}`)
            .send({ password: newPassword });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Invalid token');
    });
  })

  // 6. verifyToken Middleware
  describe('verifyToken Middleware', () => {
    // This middleware is used in many routes, we can test it via one of them
    const testRoute = '/api/v1/me' // This route uses the getMe controller

    it('should accept a valid JWT and attach user to req', async () => {
      // 1. Create a user to get a valid ObjectId
      const user = await StudentSchema.create({
        status: 'approved',
        email: 'test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Is',
        matricNo: '12345',
        admissionYear: 2021
      })

      // 2. Use the real user's ID and role to create the token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET)

      const res = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${token}`)

      expect(res.statusCode).not.toBe(401)
      // We can't directly check req.user here, but a non-401 status implies success.
      // The successful response from getMe confirms the middleware worked.
      expect(res.statusCode).toBe(200)
    })

    it('should reject a missing token', async () => {
      const res = await request(app).get(testRoute)
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Authorization header required')
    })

    it('should reject a malformed token', async () => {
      const res = await request(app)
        .get(testRoute)
        .set('Authorization', 'Bearer malformedtoken')
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid token')
    })

    it('should reject an expired token', async () => {
      const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET, { expiresIn: '-1s' })
      const res = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Token expired')
    })
  })

  // 7. authoriseRoles Middleware
  describe('authoriseRoles Middleware', () => {
    const adminToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'admin' }, process.env.JWT_SECRET)
    const lecturerToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'lecturer' }, process.env.JWT_SECRET)
    const studentToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'student' }, process.env.JWT_SECRET)
    const testRoute = '/api/v1/lecturers' // A route protected by authoriseRoles

    it('should allow users whose roles match', async () => {
      const res = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${lecturerToken}`)
      expect(res.statusCode).toBe(200)
    })

    it('should deny users whose role is not permitted', async () => {
      const res = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${studentToken}`)
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Access denied')
    })

    it('should allow admin to access restricted routes', async () => {
      const res = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(200)
    })
  })
})
