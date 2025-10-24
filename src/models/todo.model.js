import pool from '../config/db.js'

export async function findAllByUser (user_id) {
  const [rows] = await pool.query(
    'SELECT id, title, description, due_date, completed, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    [user_id]
  )
  return rows
}

export async function create ({ user_id, title, description, due_date, completed }) {
  const [result] = await pool.query(
    'INSERT INTO todos (user_id, title, description, due_date, completed) VALUES (?, ?, ?, ?, ?)',
    [user_id, title, description, due_date, completed]
  )

  const [rows] = await pool.query('SELECT id, title, description, due_date, completed, created_at, updated_at FROM todos WHERE id = ?', [result.insertId])
  return rows[0]
}

export async function updateById ({ id, user_id, title, description, due_date, completed }) {
  // Build dynamic update
  const fields = []
  const values = []

  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date) }
  if (completed !== undefined) { fields.push('completed = ?'); values.push(Boolean(completed)) }

  if (fields.length === 0) return null

  values.push(id, user_id)

  const [result] = await pool.query(
    `UPDATE todos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    values
  )

  if (result.affectedRows === 0) return null

  const [rows] = await pool.query('SELECT id, title, description, due_date, completed, created_at, updated_at FROM todos WHERE id = ?', [id])
  return rows[0]
}

export async function removeById ({ id, user_id }) {
  const [result] = await pool.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, user_id])
  return result.affectedRows > 0
}
