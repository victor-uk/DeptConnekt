import { Router } from 'express'
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  archiveAnnouncement,
  unarchiveAnnouncement
} from './AnnouncementController.js'
import {
  announcementSchema,
  updateAnnouncementSchema,
} from '../middlewares/schemaValidation.js'
import {
  verifyToken,
  verifyApprovedUser,
  authoriseRoles,
  validateInput,
} from '../middlewares/authMiddleware.js'
const router = Router({ mergeParams: true })

router.use(verifyToken, verifyApprovedUser)
/**
 * @swagger
 * /api/v1/announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *               - preview
 *               - admissionYear
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               preview:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: ["general", "academic", "event", "alert", "other"]
 *               admissionYear:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: timeline
 *         schema:
 *           type: integer
 *         description: Filter announcements from the last N days
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title (search)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ["general", "academic", "event", "alert", "other"]
 *         description: Filter by category
 */
router
  .route('/announcements')
  .post(
    authoriseRoles({
      roles: ['admin', 'lecturer', 'courseAdviser', 'studentAdmin']
    }),
    validateInput(announcementSchema),
    createAnnouncement
  )
  .get(
    authoriseRoles({
      roles: ['admin', 'lecturer', 'courseAdviser', 'studentAdmin', 'student']
    }),
    getAnnouncements
  )

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement details
 *       404:
 *         description: Announcement not found
 *   patch:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted
 */
router
  .route('/announcements/:id')
  .get(
    authoriseRoles({
      roles: ['admin', 'lecturer', 'courseAdviser', 'studentAdmin', 'student']
    }),
    getAnnouncementById
  )
  .patch(
    authoriseRoles({
      resourceName: 'announcement',
      own: true,
      roles: ['admin']
    }),
    validateInput(updateAnnouncementSchema),
    updateAnnouncement
  )
  .delete(
    authoriseRoles({
      resourceName: 'announcement',
      own: true,
      roles: ['admin']
    }),
    deleteAnnouncement
  )

/**
 * @swagger
 * /api/v1/announcements/{id}/archive:
 *   patch:
 *     summary: Archive an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement archived
 */
router
  .route('/announcements/:id/archive')
  .patch(
    authoriseRoles({
      resourceName: 'announcement',
      own: true,
      roles: ['admin']
    }),
    archiveAnnouncement
  )

/**
 * @swagger
 * /api/v1/announcements/{id}/unarchive:
 *   patch:
 *     summary: Unarchive an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement unarchived
 */
router
  .route('/announcements/:id/unarchive')
  .patch(
    authoriseRoles({
      resourceName: 'announcement',
      own: true,
      roles: ['admin']
    }),
    unarchiveAnnouncement
  )

export default router
