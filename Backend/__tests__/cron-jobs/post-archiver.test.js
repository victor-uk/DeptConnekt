import mongoose from 'mongoose'
import { jest } from '@jest/globals'
import cron from 'node-cron'
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

  describe('Retry Logic', () => {
    let cronSpy;
    let setTimeoutSpy;
    let updateManySpy;

    beforeEach(() => {
      // Mock timers to manually advance timeouts
      jest.useFakeTimers();

      // We spy on cron.schedule to capture the registered callback
      cronSpy = jest.spyOn(cron, 'schedule').mockImplementation((pattern, callback) => {
        // do not actually schedule in node-cron, just record the call
      });

      // Spy on setTimeout to verify retry is scheduled
      setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should retry job when an error occurs during archiving', async () => {
      const { startJobs } = await import('../../cron-jobs/post-archiver.js');

      // Make the database update fail to trigger the catch block
      updateManySpy = jest.spyOn(AnnouncementSchema, 'updateMany').mockRejectedValue(new Error('Archiving Failed'));

      // Call startJobs which triggers startAnnouncementJobs, etc.
      startJobs();

      // cron.schedule should be called 3 times (Announcement, Assignment, Event)
      expect(cronSpy).toHaveBeenCalledTimes(3);

      // Get the job callback for announcements (first call to cron.schedule)
      const announcementJob = cronSpy.mock.calls[0][1];

      // Execute the job (this mimics cron triggering it at midnight)
      await announcementJob();

      // Because it fails, it should catch the error and schedule a retry via setTimeout
      expect(updateManySpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBe(5000); // 5 seconds delay

      // Make the DB succeed THIS time
      updateManySpy.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

      // Fast forward the timer to execute the retry callback 
      jest.advanceTimersByTime(5000);

      // We need to allow the promise microtasks to flush
      // since attemptArchive is async and calls updateManySpy
      await Promise.resolve();
      await Promise.resolve();

      // updateManySpy should be called a second time now
      expect(updateManySpy).toHaveBeenCalledTimes(2);

      // And it should have succeeded, so no more retries
      // This means setTimeout shouldn't be called a second time
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

      // And cronSpy shouldn't have been called a 4th time
      expect(cronSpy).toHaveBeenCalledTimes(3);
    });
  });
});
