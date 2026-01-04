import * as cron from "node-cron"
import AnnouncementSchema from "../models/AnnouncementSchema"
import AssignmentSchema from "../models/AssignmentSchema"
import { resourceModel } from "../middlewares/authMiddleware";

export const sixtyDaysInMs = 1000 * 60 * 60 * 24 * 60;
export const sixMonthsInMs = 1000 * 60 * 60 * 24 * 30 * 6;
export const fourteenDaysInMs = 1000 * 60 * 60 * 24 * 14;

export const archivePosts = async (dueDateField, model, cutoffInMs, expiryInMs) => {
  console.log(`Archiving ${model}s...`)
  const cutoffDate = new Date(Date.now() - cutoffInMs); // 60 days ago
  const expiryDate = new Date(Date.now() + expiryInMs); // 6 months from now

  await resourceModel[model].updateMany(
    { [dueDateField]: { $lte: cutoffDate }, archived: false },
    {
      $set: {
        archived: true,
        archivedAt: new Date(),
        expiresAt: expiryDate
      }
    }
  );
  console.log(`${model}s archived successfully`);
}

const startAnnouncementJobs = (retries = 0) => {
  cron.schedule(" 0 0 * * *", async () => {
    try {
      await archivePosts("createdAt", "announcement", sixtyDaysInMs, sixMonthsInMs)
    } catch (error) {
      console.log(error)
      if (retries < 3) {
        setTimeout(() => startAnnouncementJobs(retries + 1), 5000);
      }
    }
  })
}

const startAssignmentJobs = (retries = 0) => {
  cron.schedule(" 0 0 * * *", async () => {
    try {
      await archivePosts("deadline", "assignment", fourteenDaysInMs, sixMonthsInMs)
    } catch (error) {
      console.log(error)
      if (retries < 3) {
        setTimeout(() => startAssignmentJobs(retries + 1), 5000);
      }
    }
  })
}

const startEventJobs = (retries = 0) => {
  cron.schedule(" 0 0 * * *", async () => {
    try {
      await archivePosts("eventDate", "event", fourteenDaysInMs, sixMonthsInMs)
    } catch (error) {
      console.log(error)
      if (retries < 3) {
        setTimeout(() => startEventJobs(retries + 1), 5000);
      }
    }
  })
}

export const startJobs = () => {
  startAnnouncementJobs();
  startAssignmentJobs();
  startEventJobs();
}


