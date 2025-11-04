import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listMyProjects, createProject, getProjectDetail, addMember, listProjectTasks, createTask, updateTask, deleteTask, listMembers, leaveProject, changeMemberRole, removeMember, inviteByEmail } from '../controllers/projects.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listMyProjects)
router.post('/', createProject)
router.get('/:id', getProjectDetail)
router.post('/:id/members', addMember)
router.get('/:id/members', listMembers)
router.post('/:id/invite', inviteByEmail)
router.put('/:id/members/:userId', changeMemberRole)
router.delete('/:id/members/:userId', removeMember)
router.post('/:id/leave', leaveProject)
router.get('/:id/tasks', listProjectTasks)
router.post('/:id/tasks', createTask)
router.put('/tasks/:taskId', updateTask)
router.delete('/tasks/:taskId', deleteTask)

export default router
