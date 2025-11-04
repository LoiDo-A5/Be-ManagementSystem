import { ProjectMember, Project, TaskLabel, TaskLabelMap, ProjectTask } from '../models/index.js'

async function ensureMembership(project_id, user_id) {
  const mem = await ProjectMember.findOne({ where: { project_id, user_id } })
  return !!mem
}

async function ensureAdmin(project_id, user_id) {
  const mem = await ProjectMember.findOne({ where: { project_id, user_id } })
  if (!mem) return false
  return mem.role === 'owner' || mem.role === 'admin'
}

export async function listLabels(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })
    if (!await ensureMembership(project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    const rows = await TaskLabel.findAll({ where: { project_id }, order: [['updated_at','DESC']] })
    res.json(rows.map(r => r.get({ plain: true })))
  } catch (err) { next(err) }
}

export async function createLabel(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const { name, color } = req.body
    if (!name || !color) return res.status(400).json({ error: 'name and color are required' })
    if (!await ensureAdmin(project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    const row = await TaskLabel.create({ project_id, name, color })
    res.status(201).json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateLabel(req, res, next) {
  try {
    const id = Number(req.params.labelId)
    const { name, color } = req.body
    const label = await TaskLabel.findByPk(id)
    if (!label) return res.status(404).json({ error: 'Label not found' })
    if (!await ensureAdmin(label.project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    if (name !== undefined) label.name = name
    if (color !== undefined) label.color = color
    await label.save()
    res.json(label.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteLabel(req, res, next) {
  try {
    const id = Number(req.params.labelId)
    const label = await TaskLabel.findByPk(id)
    if (!label) return res.status(404).json({ error: 'Label not found' })
    if (!await ensureAdmin(label.project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    await TaskLabel.destroy({ where: { id } })
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function assignLabel(req, res, next) {
  try {
    const task_id = Number(req.params.taskId)
    const label_id = Number(req.params.labelId)
    const task = await ProjectTask.findByPk(task_id)
    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (!await ensureMembership(task.project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    const label = await TaskLabel.findByPk(label_id)
    if (!label || label.project_id !== task.project_id) return res.status(400).json({ error: 'Invalid label' })
    await TaskLabelMap.findOrCreate({ where: { task_id, label_id } })
    res.status(201).json({ task_id, label_id })
  } catch (err) { next(err) }
}

export async function unassignLabel(req, res, next) {
  try {
    const task_id = Number(req.params.taskId)
    const label_id = Number(req.params.labelId)
    const task = await ProjectTask.findByPk(task_id)
    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (!await ensureMembership(task.project_id, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    await TaskLabelMap.destroy({ where: { task_id, label_id } })
    res.status(204).send()
  } catch (err) { next(err) }
}
