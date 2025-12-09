import request from 'supertest'
import app from '../../config/app.js'
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js'
import {
  generateTestToken,
  createTestLecturer,
  createTestStudent,
  getAuthHeader
} from '../helpers/testHelpers.js'
import TimetableSchema from '../../models/TimetableSchema.js'
import mongoose from 'mongoose'

describe('Timetable Routes', () => {
  let lecturer, student, adminToken, lecturerToken, studentToken

  const timetableData = {
    admissionYear: 2021,
    semester: 'First',
    level: 100
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

  describe('POST /api/v1/timetables', () => {
    it('should create a timetable successfully', async () => {
      const res = await request(app)
        .post('/api/v1/timetables')
        .set(getAuthHeader(lecturerToken))
        .send(timetableData)

      expect(res.status).toBe(201)
      expect(res.body.data.level).toBe(String(timetableData.level))
      expect(res.body.data.createdByModel).toBe('Lecturer')
    })

    it('should reject unauthorized roles (student)', async () => {
      const res = await request(app)
        .post('/api/v1/timetables')
        .set(getAuthHeader(studentToken))
        .send(timetableData)

      expect(res.status).toBe(403)
    })

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/api/v1/timetables')
        .set(getAuthHeader(lecturerToken))
        .send({ level: 99 }) // Invalid

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/timetables', () => {
    it('should fetch timetables with filters', async () => {
      await TimetableSchema.create({ ...timetableData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get('/api/v1/timetables?level=100&semester=First')
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
    })

    it('should restrict students based on admissionYear', async () => {
      await TimetableSchema.create({ ...timetableData, admissionYear: '2022', createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get('/api/v1/timetables?admissionYear=2022')
        .set(getAuthHeader(studentToken)) // student is from 2021

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(0)
    
    })
  })

  describe('GET /api/v1/timetables/:id', () => {
    it('should fetch a single timetable', async () => {
      const timetable = await TimetableSchema.create({ ...timetableData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get(`/api/v1/timetables/${timetable._id}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(timetable._id.toString())
    })

    it('should return 404 if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/v1/timetables/${fakeId}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/v1/timetables/:id/classes', () => {
    let timetable, classData

    beforeEach(async () => {
      timetable = await TimetableSchema.create({ ...timetableData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      classData = {
        day: 'Monday',
        classData: {
          courseCode: 'CSC101',
          courseTitle: 'Intro to Computer Science',
          venue: 'Room 101',
          startTime: '09:00',
          endTime: '11:00'
        }
      }
    })

    it('should add a class to the specified day', async () => {
      const res = await request(app)
        .post(`/api/v1/timetables/${timetable._id}/classes`)
        .set(getAuthHeader(lecturerToken))
        .send(classData)

      expect(res.status).toBe(200)
      expect(res.body.data.weekDays[0].classes).toHaveLength(1)
      expect(res.body.data.weekDays[0].classes[0].courseCode).toBe('CSC101')
      expect(res.body.data.weekDays[0].classes[0].lecturer.toString()).toBe(lecturer._id.toString())
    })

    // This test is no longer relevant as the ID is from the token, not the body/query.
    // A test to ensure non-lecturers can't add classes would be covered by the `canCreateRoles` middleware test.
  })

  describe('DELETE /api/v1/timetables/:id/classes/:classId', () => {
    let timetable
    beforeEach(async () => {
      // Correctly create a timetable with the weekDays structure
      timetable = await TimetableSchema.create({
        ...timetableData,
        createdBy: lecturer._id,
        createdByModel: 'Lecturer',
        weekDays: [{
          day: 'Monday',
          classes: [{
            courseCode: 'CSC101',
            courseTitle: 'Intro to CS',
            venue: 'Room 101',
            startTime: '09:00',
            endTime: '11:00',
            lecturer: lecturer._id // Use 'lecturer' as per schema
          }]
        }]
      })
    })

    it('should remove a class successfully', async () => {
      const res = await request(app)
        // The classId in the path is required by the route but not used by the controller.
        // The controller uses query parameters to find the class.
        .delete(`/api/v1/timetables/${timetable._id}/classes/any-class-id`)
        .query({ dayName: 'Monday', courseCode: 'CSC101' })
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      const updatedTimetable = await TimetableSchema.findById(timetable._id)
      // Assert against the correct schema structure
      expect(updatedTimetable.weekDays.find(d => d.day === 'Monday').classes).toHaveLength(0)
    })
  })
})