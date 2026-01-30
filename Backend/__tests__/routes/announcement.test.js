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
import AnnouncementSchema from '../../models/AnnouncementSchema.js'
import mongoose from 'mongoose'
import { generatePreview } from '../../helpers/generatePreview.js'

describe('Announcement Routes', () => {
  let lecturer, student, adminToken, lecturerToken, studentToken

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
    const admin = await createTestAdmin()

    adminToken = generateTestToken(admin._id, 'admin')
    lecturerToken = generateTestToken(lecturer._id, 'lecturer')
    studentToken = generateTestToken(student._id, 'student')
  })

  it('should create announcement as lecturer', async () => {
    const announcementData = {
      title: 'Test Announcement',
      body: 'This is a test announcement body with enough content',
      category: 'general',
      preview: generatePreview('This is a test announcement body with enough content'),
      admissionYear: [2021]
    }

    const response = await request(app)
      .post('/api/v1/announcements')
      .set(getAuthHeader(lecturerToken))
      .send(announcementData)

    expect(response.status).toBe(201)
    expect(response.body.data.title).toBe(announcementData.title)
    expect(response.body.data.createdBy).toBeDefined()
  })

  it('should reject invalid announcement data', async () => {
    const response = await request(app)
      .post('/api/v1/announcements')
      .set(getAuthHeader(lecturerToken))
      .send({ title: 'AB', body: 'Test', category: 'general' })

    expect(response.status).toBe(400)
  })

  it('should deny announcement creation for student', async () => {
    const response = await request(app)
      .post('/api/v1/announcements')
      .set(getAuthHeader(studentToken))
      .send({ title: 'Test', body: 'Test body', category: 'general' })

    expect(response.status).toBe(403)
  })

  it('should require authentication to create announcement', async () => {
    const response = await request(app)
      .post('/api/v1/announcements')
      .send({ title: 'Test', body: 'Test body', category: 'general' })

    expect(response.status).toBe(401)
  })

  it('should get all announcements', async () => {
    await AnnouncementSchema.create({
      title: 'First Announcement',
      body: 'First announcement body',
      preview: 'First announcement body',
      category: 'general',
      admissionYear: 2023,
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .get('/api/v1/announcements')
      .set(getAuthHeader(lecturerToken))

    expect(response.status).toBe(200)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  it('should filter announcements by category', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'Academic Announcement',
      body: 'Body',
      preview: 'Body',
      category: 'academic',
      admissionYear: 2021,
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .get('/api/v1/announcements?category=academic')
      .set(getAuthHeader(studentToken))

    expect(response.status).toBe(200)
    expect(response.body.data[0].category).toBe('academic')
  })

  it('should restrict a student to fetching announcements for their own admission year only', async () => {
    // Announcement for the student's year
    await AnnouncementSchema.create({
      title: 'Announcement for 2021',
      body: 'Body for 2021',
      preview: 'Body for 2021',
      category: 'academic',
      admissionYear: ['2021'],
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })
    // Announcement for a different year
    await AnnouncementSchema.create({
      title: 'Announcement for 2022',
      body: 'Body for 2022',
      preview: 'Body for 2022',
      category: 'academic',
      admissionYear: ['2022'],
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    // Student from 2021 attempts to fetch announcements, even trying to query for another year
    const response = await request(app)
      .get('/api/v1/announcements?admissionYear=2022')
      .set(getAuthHeader(studentToken))

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].title).toBe('Announcement for 2021')
  })

  it('should get announcement by ID', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'Test Announcement',
      body: 'Test body',
      preview: 'Test body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .get(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(studentToken))

    expect(response.status).toBe(200)
    expect(response.body.data._id).toBe(announcement._id.toString())
  })

  it('should return 404 for non-existent announcement', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const response = await request(app)
      .get(`/api/v1/announcements/${fakeId}`)
      .set(getAuthHeader(studentToken))

    expect(response.status).toBe(404)
  })

  it('should update announcement as creator', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'Original Title',
      body: 'Original body',
      preview: 'Original body',
      admissionYear: 2023,
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .patch(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(lecturerToken))
      .send({ title: 'Updated Title', category: 'academic' })

    expect(response.status).toBe(200)
    expect(response.body.data.title).toBe('Updated Title')
  })

  it('should update announcement as admin', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'Original Title',
      body: 'Original body',
      preview: 'Original body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .patch(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(adminToken))
      .send({ title: 'Admin Updated' })

    expect(response.status).toBe(200)
    expect(response.body.data.title).toBe('Admin Updated')
  })

  it('should deny update for non-creator non-admin', async () => {
    const otherLecturer = await createTestLecturer({ status: 'approved', email: 'other@test.com' })
    const otherToken = generateTestToken(otherLecturer._id.toString(), 'lecturer')

    const announcement = await AnnouncementSchema.create({
      title: 'Original Title',
      body: 'Original body',
      preview: 'Original body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .patch(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(otherToken))
      .send({ title: 'Unauthorized Update' })

    expect(response.status).toBe(403)
  })

  it('should delete announcement as creator', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'To Be Deleted',
      body: 'Body',
      preview: 'Body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .delete(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(lecturerToken))

    expect(response.status).toBe(200)
    const deleted = await AnnouncementSchema.findById(announcement._id)
    expect(deleted).toBeNull()
  })

  it('should delete announcement as admin', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'To Be Deleted',
      body: 'Body',
      preview: 'Body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer'
    })

    const response = await request(app)
      .delete(`/api/v1/announcements/${announcement._id}`)
      .set(getAuthHeader(adminToken))

    expect(response.status).toBe(200)
    const deleted = await AnnouncementSchema.findById(announcement._id)
    expect(deleted).toBeNull()
  })

  it('should archive announcement', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'To Be Archived',
      body: 'Body',
      preview: 'Body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer',
      archived: false
    })

    const response = await request(app)
      .patch(`/api/v1/announcements/${announcement._id}/archive`)
      .set(getAuthHeader(lecturerToken))

    expect(response.status).toBe(200)
    expect(response.body.data.archived).toBe(true)
  })

  it('should unarchive announcement', async () => {
    const announcement = await AnnouncementSchema.create({
      title: 'To Be Unarchived',
      body: 'Body',
      preview: 'Body',
      category: 'general',
      createdBy: lecturer._id,
      createdByModel: 'Lecturer',
      archived: true,
      archivedAt: new Date()
    })

    const response = await request(app)
      .patch(`/api/v1/announcements/${announcement._id}/unarchive`)
      .set(getAuthHeader(lecturerToken))

    expect(response.status).toBe(200)
    expect(response.body.data.archived).toBe(false)
  })
})
