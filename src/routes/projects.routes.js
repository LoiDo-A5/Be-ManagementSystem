import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listMyProjects, createProject, getProjectDetail, addMember, listProjectTasks, createTask, updateTask, deleteTask } from '../controllers/projects.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listMyProjects)
router.post('/', createProject)
router.get('/:id', getProjectDetail)
router.post('/:id/members', addMember)
router.get('/:id/tasks', listProjectTasks)
router.post('/:id/tasks', createTask)
router.put('/tasks/:taskId', updateTask)
router.delete('/tasks/:taskId', deleteTask)

export default router
