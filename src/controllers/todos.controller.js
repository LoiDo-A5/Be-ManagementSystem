import { create, findAllByUser, removeById, updateById } from '../models/todo.model.js'

export async function getTodos (req, res, next) {
  try {
    const todos = await findAllByUser(req.user.id)
    res.json(todos)
  } catch (err) {
    next(err)
  }
}

export async function createTodo (req, res, next) {
  try {
    const { title, description, due_date, completed } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })

    const todo = await create({
      user_id: req.user.id,
      title,
      description: description || null,
      due_date: due_date || null,
      completed: Boolean(completed) || false
    })

    res.status(201).json(todo)
  } catch (err) {
    next(err)
  }
}

export async function updateTodo (req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })

    const { title, description, due_date, completed } = req.body

    const updated = await updateById({
      id,
      user_id: req.user.id,
      title,
      description,
      due_date,
      completed
    })

    if (!updated) return res.status(404).json({ error: 'Todo not found' })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function deleteTodo (req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })

    const ok = await removeById({ id, user_id: req.user.id })
    if (!ok) return res.status(404).json({ error: 'Todo not found' })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
