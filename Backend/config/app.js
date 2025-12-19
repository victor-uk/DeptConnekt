import express from "express";
import cors from "cors"
import { whitelist } from "./defaults.js";
import { errorHandler, notFound } from "../middlewares/errorHandler.js";
import helmet from "helmet";
import authRoutes from "../Auth/authRoutes.js"
import userRoutes from "../Users/userRoutes.js"
import announcementRoutes from "../Announcement/AnnouncementRoutes.js"
import assignmentRoutes from "../Assignment/AssignmentRoutes.js"
import eventRoutes from "../Event/EventRoutes.js"
import timetableRoutes from "../Timetable/timetableRoutes.js"
import { timeoutMiddleware, haltOnTimedout } from '../middlewares/timeoutMiddleware.js';
import mongoSanitise from 'express-mongo-sanitize'


const app = express()

app.use(helmet())
app.use(cors({
    origin: whitelist,
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    mongoSanitise.sanitize(req.body);
    mongoSanitise.sanitize(req.query);
    mongoSanitise.sanitize(req.params);
    next();
  })
app.use(timeoutMiddleware);

// Routes
app.get("/", (req, res) => {
    res.send("DeptConnekt is loading")
})
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1", userRoutes)
app.use("/api/v1", announcementRoutes)
app.use("/api/v1", assignmentRoutes)
app.use("/api/v1", eventRoutes)
app.use("/api/v1", timetableRoutes)


app.use(haltOnTimedout)

//exceptiion handlers
app.use(notFound)
app.use(errorHandler)

export default app