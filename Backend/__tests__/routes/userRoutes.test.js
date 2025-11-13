import request from 'supertest'
import app from '../../config/app.js'
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js'
import {
  generateTestToken,
  createTestLecturer,
  createTestStudent,
  getAuthHeader
} from '../helpers/testHelpers.js'
import LecturerSchema from '../../models/LecturerSchema.js'
import StudentSchema from '../../models/StudentSchema.js'
import mongoose from 'mongoose'

describe('User Routes', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await closeDB()
  })

  afterEach(async () => {
    await clearDB()
  })

  it('should get current user profile for approved user', async () => {
    const lecturer = await createTestLecturer({ status: 'approved' })
    const token = generateTestToken(lecturer._id.toString(), 'lecturer')

    const response = await request(app)
      .get('/api/v1/me')
      .set(getAuthHeader(token))

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe(lecturer.email)
  })

  it('should deny access for pending user', async () => {
    const lecturer = await createTestLecturer({ status: 'pending' })
    const token = generateTestToken(lecturer._id.toString(), 'lecturer')

    const response = await request(app)
      .get('/api/v1/me')
      .set(getAuthHeader(token))

    expect(response.status).toBe(403)
  })

  it('should require authentication for /me endpoint', async () => {
    const response = await request(app).get('/api/v1/me')
    expect(response.status).toBe(401)
  })

  it('should update current user profile', async () => {
    const lecturer = await createTestLecturer({ status: 'approved' })
    const token = generateTestToken(lecturer._id.toString(), 'lecturer')

    const response = await request(app)
      .patch('/api/v1/me')
      .set(getAuthHeader(token))
      .send({ email: 'newemail@test.com', profileImg: 'https://res.cloudinary.com/test/image.jpg' })

    expect(response.status).toBe(200)
    expect(response.body.data.email).toBe('newemail@test.com')
  })

  it('should reject invalid input when updating profile', async () => {
    const lecturer = await createTestLecturer({ status: 'approved' })
    const token = generateTestToken(lecturer._id.toString(), 'lecturer')

    const response = await request(app)
      .patch('/api/v1/me')
      .set(getAuthHeader(token))
      .send({ email: 'invalid-email' })

    expect(response.status).toBe(400)
  })

  it('should get all lecturers for authorized user', async () => {
    await createTestLecturer({ status: 'approved' })
    const adminToken = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .get('/api/v1/lecturers')
      .set(getAuthHeader(adminToken))

    expect(response.status).toBe(200)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  it('should get lecturer by ID', async () => {
    const lecturer = await createTestLecturer({ status: 'approved' })
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'student')

    const response = await request(app)
      .get(`/api/v1/lecturers/${lecturer._id}`)
      .set(getAuthHeader(token))

    expect(response.status).toBe(200)
    expect(response.body.data._id).toBe(lecturer._id.toString())
  })

  it('should return 404 for non-existent lecturer', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .get(`/api/v1/lecturers/${fakeId}`)
      .set(getAuthHeader(token))

    expect(response.status).toBe(404)
  })

  it('should get students by admission year', async () => {
    await createTestStudent({ admissionYear: 2020 })
    await createTestStudent({ admissionYear: 2020 })
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .get('/api/v1/students?admissionYear=2020')
      .set(getAuthHeader(token))

    expect(response.status).toBe(200)
    expect(response.body.data.length).toBe(2)
  })

  it('should require admissionYear query parameter', async () => {
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .get('/api/v1/students')
      .set(getAuthHeader(token))

    expect(response.status).toBe(400)
  })

  it('should get student by ID for authorized user', async () => {
    const student = await createTestStudent()
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .get(`/api/v1/students/${student._id}`)
      .set(getAuthHeader(token))

    expect(response.status).toBe(200)
    expect(response.body.data._id).toBe(student._id.toString())
  })

  it('should approve lecturer as admin', async () => {
    const lecturer = await createTestLecturer({ status: 'pending' })
    const adminToken = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .patch(`/api/v1/lecturers/approve/${lecturer._id}`)
      .set(getAuthHeader(adminToken))

    expect(response.status).toBe(200)
    const updatedLecturer = await LecturerSchema.findById(lecturer._id)
    expect(updatedLecturer.status).toBe('approved')
  })

  it('should deny lecturer approval for non-admin', async () => {
    const lecturer = await createTestLecturer({ status: 'pending' })
    const token = generateTestToken(new mongoose.Types.ObjectId().toString(), 'lecturer')

    const response = await request(app)
      .patch(`/api/v1/lecturers/approve/${lecturer._id}`)
      .set(getAuthHeader(token))

    expect(response.status).toBe(403)
  })

  it('should update lecturer as admin', async () => {
    const lecturer = await createTestLecturer()
    const adminToken = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .put(`/api/v1/lecturers/${lecturer._id}`)
      .set(getAuthHeader(adminToken))
      .send({ firstName: 'Updated', email: 'updated@test.com' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('should delete lecturer as admin', async () => {
    const lecturer = await createTestLecturer()
    const adminToken = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .delete(`/api/v1/lecturers/${lecturer._id}`)
      .set(getAuthHeader(adminToken))

    expect(response.status).toBe(200)
    const deletedLecturer = await LecturerSchema.findById(lecturer._id)
    expect(deletedLecturer).toBeNull()
  })

  it('should delete student as admin', async () => {
    const student = await createTestStudent()
    const adminToken = generateTestToken(new mongoose.Types.ObjectId().toString(), 'admin')

    const response = await request(app)
      .delete(`/api/v1/students/${student._id}`)
      .set(getAuthHeader(adminToken))

    expect(response.status).toBe(200)
    const deletedStudent = await StudentSchema.findById(student._id)
    expect(deletedStudent).toBeNull()
  })
})
