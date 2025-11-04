import { ProjectMember, ProjectTask, TaskChecklist, TaskChecklistItem } from '../models/index.js'

async function ensureTaskMembership(task_id, user_id) {
  const task = await ProjectTask.findByPk(task_id)
  if (!task) return { ok: false, status: 404, error: 'Task not found' }
  const mem = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id } })
  if (!mem) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, task }
}

export async function listChecklists(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const rows = await TaskChecklist.findAll({ where: { task_id: taskId }, order: [['created_at','ASC']] })
    res.json(rows.map(r => r.get({ plain: true })))
  } catch (err) { next(err) }
}

export async function createChecklist(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const row = await TaskChecklist.create({ task_id: taskId, title })
    res.status(201).json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateChecklist(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { title } = req.body
    const row = await TaskChecklist.findByPk(id)
    if (!row) return res.status(404).json({ error: 'Checklist not found' })
    const test = await ensureTaskMembership(row.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    if (title !== undefined) row.title = title
    await row.save()
    res.json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteChecklist(req, res, next) {
  try {
    const id = Number(req.params.id)
    const row = await TaskChecklist.findByPk(id)
    if (!row) return res.status(404).json({ error: 'Checklist not found' })
    const test = await ensureTaskMembership(row.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    await row.destroy()
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function addChecklistItem(req, res, next) {
  try {
    const checklistId = Number(req.params.id)
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const checklist = await TaskChecklist.findByPk(checklistId)
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' })
    const test = await ensureTaskMembership(checklist.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const row = await TaskChecklistItem.create({ checklist_id: checklistId, title })
    res.status(201).json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateChecklistItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId)
    const { title, completed } = req.body
    const item = await TaskChecklistItem.findByPk(itemId)
    if (!item) return res.status(404).json({ error: 'Item not found' })
    const checklist = await TaskChecklist.findByPk(item.checklist_id)
    const test = await ensureTaskMembership(checklist.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    if (title !== undefined) item.title = title
    if (completed !== undefined) item.completed = Boolean(completed)
    await item.save()
    res.json(item.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteChecklistItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId)
    const item = await TaskChecklistItem.findByPk(itemId)
    if (!item) return res.status(404).json({ error: 'Item not found' })
    const checklist = await TaskChecklist.findByPk(item.checklist_id)
    const test = await ensureTaskMembership(checklist.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    await item.destroy()
    res.status(204).send()
  } catch (err) { next(err) }
}
