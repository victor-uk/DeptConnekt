import request from 'supertest'
import app from '../../config/app.js'
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js'
import {
  generateTestToken,
  createTestLecturer,
  createTestStudent,
  createTestAdmin,
  getAuthHeader
} from '../helpers/testHelpers.js'
import EventSchema from '../../models/EventSchema.js'
import mongoose from 'mongoose'

describe('Event Routes', () => {
  let lecturer, student, adminToken, lecturerToken, studentToken

  const eventData = {
    title: 'Test Event',
    description: 'This is a detailed description for the test event.',
    preview: 'This is a detailed description for the test event.',
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Main Auditorium',
    admissionYear: [2021]
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
    student = await createTestStudent({ status: 'approved' })
    const admin = await createTestAdmin()

    adminToken = generateTestToken(admin._id, 'admin')
    lecturerToken = generateTestToken(lecturer._id, 'lecturer')
    studentToken = generateTestToken(student._id, 'student')
  })

  describe('POST /api/v1/events', () => {
    it('should create an event successfully', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set(getAuthHeader(lecturerToken))
        .send(eventData)

      expect(res.status).toBe(201)
      expect(res.body.data.title).toBe(eventData.title)
      expect(res.body.data.preview).toBeDefined()
      expect(res.body.data.admissionYear).toEqual(expect.arrayContaining(eventData.admissionYear))
    })

    it('should reject unauthorized roles (student)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set(getAuthHeader(studentToken))
        .send(eventData)

      expect(res.status).toBe(403)
    })

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set(getAuthHeader(lecturerToken))
        .send({ title: 'short' }) // Invalid data

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/events', () => {
    beforeEach(async () => {
      await EventSchema.create({ ...eventData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      await EventSchema.create({ ...eventData, title: 'Archived Event', archived: true, createdBy: lecturer._id, createdByModel: 'Lecturer' })
    })

    it('should fetch events with filters', async () => {
      const res = await request(app)
        .get('/api/v1/events?location=auditorium')
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].title).toBe('Test Event')
    })

    it('should paginate properly', async () => {
      await EventSchema.create({ ...eventData, title: 'Event 2', createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get('/api/v1/events?limit=1&page=2')
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
    })

    it('should filter by archived correctly', async () => {
      const res = await request(app)
        .get('/api/v1/events?archived=true')
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].title).toBe('Archived Event')
    })

    it('should return an empty array when no events exist', async () => {
      await EventSchema.deleteMany({})
      const res = await request(app)
        .get('/api/v1/events')
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('should filter by admissionYear correctly', async () => {
      await EventSchema.create({ ...eventData, title: 'Year 2022 Event', admissionYear: [2022], createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get('/api/v1/events?admissionYear=2021')
        .set(getAuthHeader(lecturerToken))

      expect(res.status).toBe(200)
      // Original eventData has [2021], so 1 + 1 (archived one also matches if it has 2021)
      // Actually clearDB happens in beforeEach, so let's check.
      // beforeEach for GET /api/v1/events creates 2 events. Both from eventData.
      expect(res.body.data.length).toBe(1) // Only the non-archived one matches (archived filter is default false in controller)
      expect(res.body.data[0].admissionYear).toContain(2021)
    })
  })

  describe('GET /api/v1/events/:id', () => {
    it('should fetch an event by ID', async () => {
      const event = await EventSchema.create({ ...eventData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .get(`/api/v1/events/${event._id}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(event._id.toString())
    })

    it('should return 404 if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/v1/events/${fakeId}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/events/:id', () => {
    let event
    beforeEach(async () => {
      event = await EventSchema.create({ ...eventData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
    })

    it('should allow admin/owner to update', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${event._id}`)
        .set(getAuthHeader(lecturerToken))
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Updated Title')
    })

    it('should reject non-owner', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${event._id}`)
        .set(getAuthHeader(studentToken))
        .send({ title: 'Unauthorized Update' })

      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/v1/events/:id', () => {
    it('should allow admin to delete event', async () => {
      const event = await EventSchema.create({ ...eventData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .delete(`/api/v1/events/${event._id}`)
        .set(getAuthHeader(adminToken))

      expect(res.status).toBe(200)
      const deleted = await EventSchema.findById(event._id)
      expect(deleted).toBeNull()
    })

    it('should reject unauthorized user', async () => {
      const event = await EventSchema.create({ ...eventData, createdBy: lecturer._id, createdByModel: 'Lecturer' })
      const res = await request(app)
        .delete(`/api/v1/events/${event._id}`)
        .set(getAuthHeader(studentToken))

      expect(res.status).toBe(403)
    })
  })
})