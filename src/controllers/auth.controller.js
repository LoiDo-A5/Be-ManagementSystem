import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getUserByEmail, createUser, getUserById } from '../models/user.model.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function signToken (user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export async function register (req, res, next) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await createUser({ name, email, passwordHash: hash })

    const token = signToken(user)
    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    next(err)
  }
}

export async function login (req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password are required' })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken(user)
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    next(err)
  }
}

export async function me (req, res, next) {
  try {
    const user = await getUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    next(err)
  }
}
