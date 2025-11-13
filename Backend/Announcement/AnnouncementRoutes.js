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
  authoriseRoles,
  updateAnnouncementSchema,
  validateInput,
  verifyToken
} from '../middlewares/authMiddleware.js'
const router = Router({ mergeParams: true })

router.use(verifyToken)
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
router
  .route('/announcements/:id')
  .get(
    authoriseRoles({
      roles: ['admin', 'lecturer', 'courseAdviser', 'studentAdmin', 'student']
    }),
    getAnnouncementById
  )
  // the authoriseRoles middleware relies on the fact that when this route is splited by '/',
  // the resourceName (e.g announcements) is returned and the mapped to the schema
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
