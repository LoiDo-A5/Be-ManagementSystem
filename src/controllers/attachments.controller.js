import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { ProjectMember, ProjectTask, TaskAttachment } from '../models/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, unique + '-' + safe)
  }
})

export const upload = multer({ storage })

async function ensureTaskMembership(task_id, user_id) {
  const task = await ProjectTask.findByPk(task_id)
  if (!task) return { ok: false, status: 404, error: 'Task not found' }
  const mem = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id } })
  if (!mem) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, task }
}

export async function listAttachments(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    const files = await TaskAttachment.findAll({ where: { task_id: taskId }, order: [['created_at','ASC']] })
    res.json(files.map(f => f.get({ plain: true })))
  } catch (err) { next(err) }
}

export async function uploadAttachment(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    if (!req.file) return res.status(400).json({ error: 'No file' })
    const fileUrl = `/uploads/${req.file.filename}`
    const row = await TaskAttachment.create({
      task_id: taskId,
      file_url: fileUrl,
      file_name: req.file.originalname,
      size: req.file.size
    })
    res.status(201).json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteAttachment(req, res, next) {
  try {
    const id = Number(req.params.id)
    const row = await TaskAttachment.findByPk(id)
    if (!row) return res.status(404).json({ error: 'Attachment not found' })
    const task = await ProjectTask.findByPk(row.task_id)
    const mem = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id: req.user.id } })
    if (!mem) return res.status(403).json({ error: 'Forbidden' })

    // Try delete file on disk
    const fname = row.file_url?.startsWith('/uploads/') ? row.file_url.replace('/uploads/', '') : null
    if (fname) {
      const filepath = path.join(uploadDir, fname)
      fs.promises.unlink(filepath).catch(() => {})
    }

    await row.destroy()
    res.status(204).send()
  } catch (err) { next(err) }
}
