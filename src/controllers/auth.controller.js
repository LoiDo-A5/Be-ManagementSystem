import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getUserByEmail, createUser, getUserById, getUserAuthById, updateUser } from '../models/user.model.js'

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

export async function updateMe (req, res, next) {
  try {
    const userId = req.user.id
    const { name, current_password, new_password } = req.body

    const user = await getUserAuthById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Prepare changes
    const changes = {}
    if (name !== undefined) {
      if (!name || String(name).trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' })
      }
      changes.name = String(name).trim()
    }

    if (new_password !== undefined && new_password !== null && new_password !== '') {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password' })
      }
      const ok = await bcrypt.compare(current_password, user.password_hash)
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })

      // Validate new password strength
      const npw = String(new_password)
      if (npw.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' })
      }
      if (npw.length > 128) {
        return res.status(400).json({ error: 'New password is too long' })
      }
      if (!/[A-Za-z]/.test(npw) || !/\d/.test(npw)) {
        return res.status(400).json({ error: 'New password must include both letters and numbers' })
      }
      // Disallow reusing the same password
      const same = await bcrypt.compare(npw, user.password_hash)
      if (same) {
        return res.status(400).json({ error: 'New password must be different from the current password' })
      }
      // Basic personal info checks (optional but helpful)
      const emailLocal = (user.email || '').split('@')[0]?.toLowerCase() || ''
      const nameLower = (user.name || '').toLowerCase()
      const npwLower = npw.toLowerCase()
      if (emailLocal && npwLower.includes(emailLocal)) {
        return res.status(400).json({ error: 'New password should not contain your email' })
      }
      if (nameLower && nameLower.length >= 3) {
        const parts = nameLower.split(/\s+/).filter(Boolean)
        if (parts.some(p => p.length >= 3 && npwLower.includes(p))) {
          return res.status(400).json({ error: 'New password should not contain your name' })
        }
      }

      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(new_password, salt)
      changes.passwordHash = hash
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ error: 'No changes provided' })
    }

    const updated = await updateUser(userId, changes)
    return res.json({ id: updated.id, name: updated.name, email: updated.email })
  } catch (err) {
    next(err)
  }
}
