import { Todo } from './index.js'

export async function findAllByUser (user_id) {
  const rows = await Todo.findAll({
    where: { user_id },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'title', 'description', 'due_date', 'completed', 'created_at', 'updated_at']
  })
  return rows.map(r => r.get({ plain: true }))
}

export async function create ({ user_id, title, description, due_date, completed }) {
  const created = await Todo.create({ user_id, title, description, due_date, completed: Boolean(completed) })
  const plain = created.get({ plain: true })
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    due_date: plain.due_date,
    completed: plain.completed,
    created_at: plain.created_at,
    updated_at: plain.updated_at
  }
}

export async function updateById ({ id, user_id, title, description, due_date, completed }) {
  const fields = {}
  if (title !== undefined) fields.title = title
  if (description !== undefined) fields.description = description
  if (due_date !== undefined) fields.due_date = due_date
  if (completed !== undefined) fields.completed = Boolean(completed)

  if (Object.keys(fields).length === 0) return null

  const [affected] = await Todo.update(fields, { where: { id, user_id } })
  if (!affected) return null

  const updated = await Todo.findByPk(id, { attributes: ['id', 'title', 'description', 'due_date', 'completed', 'created_at', 'updated_at'] })
  return updated ? updated.get({ plain: true }) : null
}

export async function removeById ({ id, user_id }) {
  const deleted = await Todo.destroy({ where: { id, user_id } })
  return deleted > 0
}
