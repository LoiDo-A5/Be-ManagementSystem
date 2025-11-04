import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listAssignees, addAssignee, removeAssignee } from '../controllers/assignees.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/tasks/:taskId/assignees', listAssignees)
router.post('/tasks/:taskId/assignees', addAssignee)
router.delete('/tasks/:taskId/assignees/:userId', removeAssignee)

export default router
