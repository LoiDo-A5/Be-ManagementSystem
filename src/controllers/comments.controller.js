import { ProjectMember, ProjectTask, TaskComment, User } from '../models/index.js'

async function ensureTaskMembership(task_id, user_id) {
  const task = await ProjectTask.findByPk(task_id)
  if (!task) return { ok: false, status: 404, error: 'Task not found' }
  const mem = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id } })
  if (!mem) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, task }
}

export async function listComments(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    const rows = await TaskComment.findAll({
      where: { task_id: taskId },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'ASC']]
    })
    const data = rows.map(r => ({ ...r.get({ plain: true }), user: r.User?.get({ plain: true }) }))
    res.json(data)
  } catch (err) { next(err) }
}

export async function addComment(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    const { content } = req.body
    if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' })
    const test = await ensureTaskMembership(taskId, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    const row = await TaskComment.create({ task_id: taskId, user_id: req.user.id, content: content.trim() })
    res.status(201).json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateComment(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { content } = req.body
    if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' })
    const row = await TaskComment.findByPk(id)
    if (!row) return res.status(404).json({ error: 'Comment not found' })

    // Ensure membership and ownership
    const test = await ensureTaskMembership(row.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    if (row.user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own comment' })

    row.content = content.trim()
    await row.save()
    res.json(row.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteComment(req, res, next) {
  try {
    const id = Number(req.params.id)
    const row = await TaskComment.findByPk(id)
    if (!row) return res.status(404).json({ error: 'Comment not found' })
    const test = await ensureTaskMembership(row.task_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    if (row.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own comment' })

    await row.destroy()
    res.status(204).send()
  } catch (err) { next(err) }
}
