import request from 'supertest'
import app from '../../config/app.js'
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js'
import {
  generateTestToken,
  createTestLecturer,
  createTestStudent,
  getAuthHeader
} from '../helpers/testHelpers.js'
import AssignmentSchema from '../../models/AssignmentSchema.js'
import mongoose from 'mongoose'

describe('Assignment Routes', () => {
  let lecturer, student, adminToken, lecturerToken, studentToken

  const assignmentData = {
    title: 'Test Assignment',
    description: 'This is a detailed description for the test assignment.',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    admissionYear: ['2021']
  }

  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await closeDB()
  })

  beforeEach(async () => {
    await clearDB()
    lecturer = await createTestLecturer({ status: 'approved' })
    student = await createTestStudent({ status: 'approved', admissionYear: 2021 })
    adminToken = generateTestToken(new mongoose.Types.ObjectId(), 'admin')
    lecturerToken = generateTestToken(lecturer._id, 'lecturer')
    studentToken = generateTestToken(student._id, 'student')
  })

  describe('POST /api/v1/assignments', () => {
    it('should create an assignment successfully', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set(getAuthHeader(lecturerToken))
        .send(assignmentData)

      expect(res.status).toBe(201)
      expect(res.body.data.title).toBe(assignmentData.title)
      expect(res.body.data.preview).toBeDefined()
    })

    it('should reject unauthorized roles (student)', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set(getAuthHeader(studentToken))
        .send(assignmentData)

      expect(res.status).toBe(403)
    })

    it('should fail when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .send(assignmentData)

      expect(res.status).toBe(401)
    })

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set(getAuthHeader(lecturerToken))
        .send({ title: 'short' }) // Invalid data

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/assignments', () => {
    beforeEach(async () => {
      await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        admissionYear: 2021,
        createdByModel: 'Lecturer'
      })
      await AssignmentSchema.create({
        ...assignmentData,
        title: 'Archived Assignment',
        preview: 'This is a detailed description...',
        archived: true,
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
    })

    it('should fetch assignments with filters', async () => {
      const res = await request(app)
        .get('/api/v1/assignments?admissionYear=2021')
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].title).toBe('Test Assignment')
    })

    it('should only return assignments for the student\'s own admission year, ignoring query parameters', async () => {
      // Create an assignment for a different year (2022)
      await AssignmentSchema.create({
        ...assignmentData,
        title: 'Assignment for 2022',
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        admissionYear: ['2022'],
        createdByModel: 'Lecturer'
      })

      // The student (from 2021) tries to fetch assignments for 2022
      const res = await request(app)
        .get('/api/v1/assignments?admissionYear=2022')
        .set(getAuthHeader(studentToken))

      // The backend should ignore the query and return only the assignment for the student's year (2021)
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('Test Assignment') // This is the assignment for 2021
    })

    it('should paginate properly', async () => {
      let ass= await AssignmentSchema.create({
        ...assignmentData,
        title: 'Assignment 2',
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
      const res = await request(app)
        .get('/api/v1/assignments?limit=1&page=2')
        .set(getAuthHeader(lecturerToken)) 

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
    })

    it('should filter by archived correctly', async () => {
      const res = await request(app)
        .get('/api/v1/assignments?archived=true')
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].title).toBe('Archived Assignment')
    })

    it('should return an empty array when no assignments exist', async () => {
      // Only clear the assignments, leaving the lecturer and student intact
      await AssignmentSchema.deleteMany({})
      const res = await request(app)
        .get('/api/v1/assignments')
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('should return an empty array for a student if no assignments match their admission year', async () => {
      // Ensure all existing assignments are not for the student's year
      await AssignmentSchema.updateMany({}, { $set: { admissionYear: ['2022'] } })

      // The student is from 2021
      const res = await request(app)
        .get('/api/v1/assignments')
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('No assignments found')
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /api/v1/assignments/:id', () => {
    it('should fetch an assignment by ID', async () => {
      const assignment = await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
      const res = await request(app)
        .get(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(assignment._id.toString())
    })

    it('should return 404 if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/v1/assignments/${fakeId}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/assignments/:id', () => {
    let assignment
    beforeEach(async () => {
      assignment = await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
      
    })

    it('should allow admin/owner to update', async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(lecturerToken))
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Updated Title')
    })

    it('should reject non-owner', async () => {
      const otherLecturer = await createTestLecturer({ status: 'approved', email: 'other@lec.com', lecturerID: 'L999' })
      const otherToken = generateTestToken(otherLecturer._id, 'lecturer')
      const res = await request(app)
        .patch(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(otherToken))
        .send({ title: 'Unauthorized Update' })

      expect(res.status).toBe(403)
    })

    it('should validate update input', async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(lecturerToken))
        .send({ title: '' }) // Invalid

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/v1/assignments/:id', () => {
    it('should allow owner to delete assignment', async () => {
      const assignment = await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
      const res = await request(app)
        .delete(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      const deleted = await AssignmentSchema.findById(assignment._id)
      expect(deleted).toBeNull()
    })

    it('should reject non-owner roles', async () => {
      const assignment = await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
      const res = await request(app)
        .delete(`/api/v1/assignments/${assignment._id}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(403)
    })
  })

  describe('Archive and Unarchive', () => {
    let assignment
    beforeEach(async () => {
      assignment = await AssignmentSchema.create({
        ...assignmentData,
        preview: 'This is a detailed description...',
        createdBy: lecturer._id,
        createdByModel: 'Lecturer'
      })
    })

    it('should archive an assignment', async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/${assignment._id}/archive`)
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data.archived).toBe(true)
    })

    it('should unarchive an assignment', async () => {
      assignment.isArchived = true
      await assignment.save()

      const res = await request(app)
        .patch(`/api/v1/assignments/${assignment._id}/unarchive`)
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data.archived).toBe(false)
    })
  })
})