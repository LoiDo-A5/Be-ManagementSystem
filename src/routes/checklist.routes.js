import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listChecklists, createChecklist, updateChecklist, deleteChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem } from '../controllers/checklist.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/tasks/:taskId/checklists', listChecklists)
router.post('/tasks/:taskId/checklists', createChecklist)
router.put('/checklists/:id', updateChecklist)
router.delete('/checklists/:id', deleteChecklist)
router.post('/checklists/:id/items', addChecklistItem)
router.put('/checklist-items/:itemId', updateChecklistItem)
router.delete('/checklist-items/:itemId', deleteChecklistItem)

export default router
