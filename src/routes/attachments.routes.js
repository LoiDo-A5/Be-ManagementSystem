import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listAttachments, uploadAttachment, deleteAttachment, upload } from '../controllers/attachments.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/tasks/:taskId/attachments', listAttachments)
router.post('/tasks/:taskId/attachments', upload.single('file'), uploadAttachment)
router.delete('/attachments/:id', deleteAttachment)

export default router
