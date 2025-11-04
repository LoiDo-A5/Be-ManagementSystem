import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getSettings, updateSettings, archiveProject, unarchiveProject } from '../controllers/settings.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/projects/:id/settings', getSettings)
router.put('/projects/:id/settings', updateSettings)
router.post('/projects/:id/archive', archiveProject)
router.post('/projects/:id/unarchive', unarchiveProject)

export default router
