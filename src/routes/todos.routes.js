import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createTodo, deleteTodo, getTodos, updateTodo } from '../controllers/todos.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getTodos)
router.post('/', createTodo)
router.put('/:id', updateTodo)
router.delete('/:id', deleteTodo)

export default router
