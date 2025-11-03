import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getLists, createList, updateList, deleteList, reorderLists } from '../controllers/lists.controller.js'

const router = Router()

router.use(authMiddleware)

// Lists under a project
router.get('/projects/:id/lists', getLists)
router.post('/projects/:id/lists', createList)
router.patch('/projects/:id/lists/reorder', reorderLists)

// Manage single list
router.put('/lists/:listId', updateList)
router.delete('/lists/:listId', deleteList)

export default router
