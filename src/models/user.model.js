import pool from '../config/db.js'

export async function getUserByEmail (email) {
  const [rows] = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1', [email])
  return rows[0] || null
}

export async function getUserById (id) {
  const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ? LIMIT 1', [id])
  return rows[0] || null
}

export async function createUser ({ name, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  )
  return { id: result.insertId, name, email }
}
