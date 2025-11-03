import express from "express";
import cors from "cors"
import { whitelist } from "./config/defaults.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import helmet from "helmet";
import authRoutes from "./Auth/authRoutes.js"
import mongoSanitise from 'express-mongo-sanitize'

const app = express()

//middlewares
app.use(helmet())
// app.use(mongoSanitise())
app.use(cors({
    origin: whitelist,
    Credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get("/", (req, res) => {
    res.send("DeptConnekt is loading")
})
app.use("/api/v1", authRoutes)

//exceptiion handlers
app.use(notFound)
app.use(errorHandler)

export default app