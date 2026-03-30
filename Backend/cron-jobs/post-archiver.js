import cron from "node-cron"
import { resourceModel } from "../middlewares/authMiddleware.js";

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

const startAnnouncementJobs = () => {
  cron.schedule(" 0 0 * * *", async () => {
    const attemptArchive = async (retries = 0) => {
      try {
        await archivePosts("createdAt", "announcement", sixtyDaysInMs, sixMonthsInMs)
      } catch (error) {
        console.log(error)
        if (retries < 3) {
          setTimeout(() => attemptArchive(retries + 1), 5000);
        }
      }
    };
    await attemptArchive();
  })
}

const startAssignmentJobs = () => {
  cron.schedule(" 0 0 * * *", async () => {
    const attemptArchive = async (retries = 0) => {
      try {
        await archivePosts("deadline", "assignment", fourteenDaysInMs, sixMonthsInMs)
      } catch (error) {
        console.log(error)
        if (retries < 3) {
          setTimeout(() => attemptArchive(retries + 1), 5000);
        }
      }
    };
    await attemptArchive();
  })
}

const startEventJobs = () => {
  cron.schedule(" 0 0 * * *", async () => {
    const attemptArchive = async (retries = 0) => {
      try {
        await archivePosts("eventDate", "event", fourteenDaysInMs, sixMonthsInMs)
      } catch (error) {
        console.log(error)
        if (retries < 3) {
          setTimeout(() => attemptArchive(retries + 1), 5000);
        }
      }
    };
    await attemptArchive();
  })
}

export const startJobs = () => {
  startAnnouncementJobs();
  startAssignmentJobs();
  startEventJobs();
}


