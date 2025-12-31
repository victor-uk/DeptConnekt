import express from "express";
import { textGenerationController, summariseTextController } from "./aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.use(verifyToken);

/**
 * @swagger
 * /api/v1/ai/assignments/generate-text:
 *   post:
 *     summary: Generate text for assignments using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text generated successfully
 */
router.post("/assignments/generate-text", textGenerationController);

/**
 * @swagger
 * /api/v1/ai/announcements/generate-text:
 *   post:
 *     summary: Generate text for announcements using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text generated successfully
 */
router.post("/announcements/generate-text", textGenerationController);

/**
 * @swagger
 * /api/v1/ai/events/generate-text:
 *   post:
 *     summary: Generate text for events using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text generated successfully
 */
router.post("/events/generate-text", textGenerationController);

/**
 * @swagger
 * /api/v1/ai/summarise-text:
 *   post:
 *     summary: Summarise text using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text summarised successfully
 */
router.post("/summarise-text", summariseTextController);

export default router;