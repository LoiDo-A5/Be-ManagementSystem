import { ProjectMember, ProjectTask, TaskAssignee, User } from '../models/index.js'

async function ensureTaskMembership(task_id, user_id) {
  const task = await ProjectTask.findByPk(task_id)
  if (!task) return { ok: false, status: 404, error: 'Task not found' }
  const mem = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id } })
  if (!mem) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, task }
}

export async function listAssignees(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const rows = await TaskAssignee.findAll({ where: { task_id: taskId }, include: [{ model: User, attributes: ['id','name','email'] }] })

    const data = rows.map(r => ({ user_id: r.user_id, user: r.User?.get?.({ plain: true }) }))
    res.json(data)
  } catch (err) { next(err) }
}

export async function addAssignee(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const { user_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })

    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    // Ensure the assignee is a member of the same project
    const isMember = await ProjectMember.findOne({ where: { project_id: test.task.project_id, user_id } })
    if (!isMember) return res.status(400).json({ error: 'User is not a member of this project' })

    await TaskAssignee.findOrCreate({ where: { task_id: taskId, user_id } })
    res.status(201).json({ task_id: taskId, user_id })
  } catch (err) { next(err) }
}

export async function removeAssignee(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const userId = Number(req.params.userId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    await TaskAssignee.destroy({ where: { task_id: taskId, user_id: userId } })
    res.status(204).send()
  } catch (err) { next(err) }
}
