import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listComments, addComment, updateComment, deleteComment } from '../controllers/comments.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/tasks/:taskId/comments', listComments)
router.post('/tasks/:taskId/comments', addComment)
router.put('/comments/:id', updateComment)
router.delete('/comments/:id', deleteComment)

export default router
