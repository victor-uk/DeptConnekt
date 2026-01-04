import mongoose from 'mongoose'
import { connectDB, closeDB, clearDB } from '../setup/testSetup.js'
import {
  archivePosts,
  sixtyDaysInMs,
  fourteenDaysInMs,
  sixMonthsInMs
} from '../../cron-jobs/post-archiver.js'
import AnnouncementSchema from '../../models/AnnouncementSchema.js'
import AssignmentSchema from '../../models/AssignmentSchema.js'
import EventSchema from '../../models/EventSchema.js'

describe('Archive Posts Integration Tests', () => {
  let lecturerId;

  beforeAll(async () => {
    await connectDB();
    lecturerId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('Announcement Archiving', () => {
    it('should archive announcements older than 60 days', async () => {
      const sixtyOneDaysAgo = new Date(Date.now() - (sixtyDaysInMs + 1000 * 60 * 60));

      // Create an announcement that should be archived
      const oldAnnouncement = await AnnouncementSchema.create({
        title: 'Old Announcement',
        body: 'This is an old announcement body',
        preview: 'Old preview',
        category: 'general',
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer',
        createdAt: sixtyOneDaysAgo // Manually setting createdAt
      });

      // Create an announcement that should NOT be archived
      const recentAnnouncement = await AnnouncementSchema.create({
        title: 'Recent Announcement',
        body: 'This is a recent announcement body',
        preview: 'Recent preview',
        category: 'general',
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer',
        createdAt: new Date()
      });

      await archivePosts('createdAt', 'announcement', sixtyDaysInMs, sixMonthsInMs);

      const archivedAnnouncement = await AnnouncementSchema.findById(oldAnnouncement._id);
      const activeAnnouncement = await AnnouncementSchema.findById(recentAnnouncement._id);

      expect(archivedAnnouncement.archived).toBe(true);
      expect(archivedAnnouncement.archivedAt).toBeDefined();
      expect(archivedAnnouncement.expiresAt).toBeDefined();

      expect(activeAnnouncement.archived).toBe(false);
      expect(activeAnnouncement.archivedAt).toBeUndefined();
    });
  });

  describe('Assignment Archiving', () => {
    it('should archive assignments with deadlines older than 14 days', async () => {
      const fifteenDaysAgo = new Date(Date.now() - (fourteenDaysInMs + 1000 * 60 * 60));

      const oldAssignment = await AssignmentSchema.create({
        title: 'Old Assignment',
        description: 'Old description that is long enough',
        preview: 'Old preview',
        deadline: fifteenDaysAgo,
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer'
      });

      const recentAssignment = await AssignmentSchema.create({
        title: 'Recent Assignment',
        description: 'Recent description that is long enough',
        preview: 'Recent preview',
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days in future
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer'
      });

      await archivePosts('deadline', 'assignment', fourteenDaysInMs, sixMonthsInMs);

      const archivedAssignment = await AssignmentSchema.findById(oldAssignment._id);
      const activeAssignment = await AssignmentSchema.findById(recentAssignment._id);

      expect(archivedAssignment.archived).toBe(true);
      expect(activeAssignment.archived).toBe(false);
    });
  });

  describe('Event Archiving', () => {
    it('should archive events older than 14 days', async () => {
      const fifteenDaysAgo = new Date(Date.now() - (fourteenDaysInMs + 1000 * 60 * 60));

      const oldEvent = await EventSchema.create({
        title: 'Old Event',
        description: 'Old event description long enough',
        preview: 'Old preview',
        eventDate: fifteenDaysAgo,
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer'
      });

      const recentEvent = await EventSchema.create({
        title: 'Upcoming Event',
        description: 'Upcoming event description long enough',
        preview: 'Upcoming preview',
        eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        admissionYear: [2021],
        createdBy: lecturerId,
        createdByModel: 'Lecturer'
      });

      await archivePosts('eventDate', 'event', fourteenDaysInMs, sixMonthsInMs);

      const archivedEvent = await EventSchema.findById(oldEvent._id);
      const activeEvent = await EventSchema.findById(recentEvent._id);

      expect(archivedEvent.archived).toBe(true);
      expect(activeEvent.archived).toBe(false);
    });
  });
});
