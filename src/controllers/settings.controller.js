import { Project, ProjectMember } from '../models/index.js'

async function ensureAdmin(project_id, user_id) {
  const mem = await ProjectMember.findOne({ where: { project_id, user_id } })
  if (!mem) return { ok: false, status: 403, error: 'Forbidden' }
  if (mem.role !== 'owner' && mem.role !== 'admin') return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true }
}

export async function getSettings(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const project = await Project.findByPk(project_id, { attributes: ['id','color','background_url','archived_at'] })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    // Any member can view settings
    res.json(project.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateSettings(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const test = await ensureAdmin(project_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })

    const { color, background_url } = req.body
    const project = await Project.findByPk(project_id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    if (color !== undefined) project.color = color
    if (background_url !== undefined) project.background_url = background_url
    await project.save()
    res.json({ id: project.id, color: project.color, background_url: project.background_url, archived_at: project.archived_at })
  } catch (err) { next(err) }
}

export async function archiveProject(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const test = await ensureAdmin(project_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const project = await Project.findByPk(project_id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    project.archived_at = new Date()
    await project.save()
    res.status(200).json({ archived_at: project.archived_at })
  } catch (err) { next(err) }
}

export async function unarchiveProject(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const test = await ensureAdmin(project_id, req.user.id)
    if (!test.ok) return res.status(test.status).json({ error: test.error })
    const project = await Project.findByPk(project_id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    project.archived_at = null
    await project.save()
    res.status(200).json({ archived_at: project.archived_at })
  } catch (err) { next(err) }
}
