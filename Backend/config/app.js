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
import aiRoutes from "../Ai/aiRoutes.js"
import { timeoutMiddleware, haltOnTimedout } from '../middlewares/timeoutMiddleware.js';
import { verifyApprovedUser } from '../middlewares/authMiddleware.js';
import mongoSanitise from 'express-mongo-sanitize'
import { setupSwagger } from "./swagger.js";
import { startJobs } from "../cron-jobs/post-archiver.js"


const app = express()

// cron jobs
if (process.env.NODE_ENV !== 'test') {
    startJobs()
}

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

setupSwagger(app);

// Routes

// app.get("/", (req, res) => {
//     res.send("DeptConnekt is loading")
// })

// app.post("/ai", async (req, res) => {
//     const client = new InferenceClient(process.env.HF_API_KEY)
//     try {
//         // 1. Set headers for streaming
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');

//         const result = client.chatCompletionStream({
//             messages: [
//                 { role: "system", content: "You are an academic assistant of the department of software engineering, FUTO" },
//                 { role: "user", content: "Create an announcement for 400l students to pay their school fees" }
//             ],
//             model: "allenai/Olmo-3-7B-Instruct:publicai"
//         })

//         for await (const chunk of result) {
//             const content = chunk.choices[0].delta?.content // choices is an array of possible answers. It's an option that can be set tell the llm to genrate diff answers
//             // content may be empty bcos some chunks are metadata, end of stream chunks or for other purposes
//             if (content) {
//                 // 2. Log to server console immediately
//                 process.stdout.write(content);

//                 // 3. Write to client (Postman/Frontend) immediately
//                 // SSE format: "data: <content>\n\n"
//                 res.write(`data: ${JSON.stringify({ content })}\n\n`);
//             }
//         }
//         // 4. End the response
//         res.end();
//     } catch (error) {
//         console.error("AI Error:", error);
//         if (error instanceof InferenceClientError) {
//             res.status(500).json({ error: error.message, details: error })
//         } else {
//             res.status(500).json({ error: error.message })
//         }
//     }
// })

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1", userRoutes)
app.use("/api/v1", announcementRoutes)
app.use("/api/v1", assignmentRoutes)
app.use("/api/v1", eventRoutes)
app.use("/api/v1", timetableRoutes)
app.use("/api/v1/ai", aiRoutes)


app.use(haltOnTimedout)

//exceptiion handlers
app.use(notFound)
app.use(errorHandler)

export default app