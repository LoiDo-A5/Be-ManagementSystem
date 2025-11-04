import { User } from './index.js'

export async function getUserByEmail (email) {
  const user = await User.findOne({ where: { email }, attributes: ['id', 'name', 'email', 'password'] })
  if (!user) return null
  // Map to previous shape: password_hash
  const plain = user.get({ plain: true })
  return { id: plain.id, name: plain.name, email: plain.email, password_hash: plain.password }
}

export async function getUserById (id) {
  const user = await User.findByPk(id, { attributes: ['id', 'name', 'email'] })
  return user ? user.get({ plain: true }) : null
}

export async function createUser ({ name, email, passwordHash }) {
  const user = await User.create({ name, email, password: passwordHash })
  return { id: user.id, name: user.name, email: user.email }
}

export async function getUserAuthById (id) {
  const user = await User.findByPk(id, { attributes: ['id', 'name', 'email', 'password'] })
  if (!user) return null
  const plain = user.get({ plain: true })
  return { id: plain.id, name: plain.name, email: plain.email, password_hash: plain.password }
}

export async function updateUser (id, { name, passwordHash }) {
  const user = await User.findByPk(id)
  if (!user) return null
  if (name !== undefined) user.name = name
  if (passwordHash !== undefined) user.password = passwordHash
  await user.save()
  return { id: user.id, name: user.name, email: user.email }
}
