import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listLabels, createLabel, updateLabel, deleteLabel, assignLabel, unassignLabel } from '../controllers/labels.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/projects/:id/labels', listLabels)
router.post('/projects/:id/labels', createLabel)
router.put('/labels/:labelId', updateLabel)
router.delete('/labels/:labelId', deleteLabel)
router.post('/tasks/:taskId/labels/:labelId', assignLabel)
router.delete('/tasks/:taskId/labels/:labelId', unassignLabel)

export default router
