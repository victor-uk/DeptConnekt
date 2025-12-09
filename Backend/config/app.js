import express from "express";
import cors from "cors"
import { whitelist } from "./defaults.js";
import { errorHandler, notFound } from "../middlewares/errorHandler.js";
import helmet from "helmet";
import authRoutes from "../Auth/AuthRoutes.js"
import userRoutes from "../Users/userRoutes.js"
import announcementRoutes from "../Announcement/AnnouncementRoutes.js"
import assignmentRoutes from "../Assignment/AssignmentRoutes.js"
import eventRoutes from "../Event/EventRoutes.js"
import timetableRoutes from "../Timetable/TimetableRoutes.js"
import { timeoutMiddleware, haltOnTimedout } from '../middlewares/timeoutMiddleware.js';
import mongoSanitise from 'express-mongo-sanitize'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This line creates the correct path to your openapi.yaml file
const swaggerDocument = YAML.load(path.join(__dirname, '../api/openapi.yaml'));

//middlewares

// This is the new route for your interactive docs.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(helmet())
app.use(cors({
    origin: whitelist,
    Credentials: true
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