import express from "express";
import { textGenerationController, summariseTextController } from "./aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.use(verifyToken);

router.post("/assignments/generate-text", textGenerationController);
router.post("/announcements/generate-text", textGenerationController);
router.post("/events/generate-text", textGenerationController);
router.post("/summarise-text", summariseTextController);

export default router;