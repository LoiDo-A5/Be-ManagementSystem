import { ProjectList, ProjectMember, ProjectTask } from '../models/index.js'

async function ensureMembership(project_id, user_id) {
  const mem = await ProjectMember.findOne({ where: { project_id, user_id } })
  return !!mem
}

export async function getLists(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid project id' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const lists = await ProjectList.findAll({ where: { project_id }, order: [['position','ASC'], ['created_at','ASC']] })
    res.json(lists.map(l => l.get({ plain: true })))
  } catch (err) { next(err) }
}

export async function createList(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const { title, position } = req.body
    if (!project_id) return res.status(400).json({ error: 'Invalid project id' })
    if (!title) return res.status(400).json({ error: 'title is required' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    // Prevent duplicates by title within a project (case-insensitive basic check)
    const existing = await ProjectList.findOne({ where: { project_id, title } })
    if (existing) {
      return res.status(200).json(existing.get({ plain: true }))
    }

    // Auto position: max + 1 if not provided
    let pos = position
    if (pos === undefined) {
      const max = await ProjectList.max('position', { where: { project_id } })
      pos = Number.isFinite(max) ? Number(max) + 1 : 0
    }

    const list = await ProjectList.create({ project_id, title, position: pos })
    res.status(201).json(list.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function updateList(req, res, next) {
  try {
    const listId = Number(req.params.listId)
    if (!listId) return res.status(400).json({ error: 'Invalid list id' })
    const list = await ProjectList.findByPk(listId)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const ok = await ensureMembership(list.project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const { title, position } = req.body
    if (title !== undefined) list.title = title
    if (position !== undefined) list.position = position
    await list.save()
    res.json(list.get({ plain: true }))
  } catch (err) { next(err) }
}

export async function deleteList(req, res, next) {
  try {
    const listId = Number(req.params.listId)
    if (!listId) return res.status(400).json({ error: 'Invalid list id' })
    const list = await ProjectList.findByPk(listId)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const ok = await ensureMembership(list.project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    // Optional: move tasks or delete tasks under list
    await ProjectTask.update({ list_id: null }, { where: { list_id: listId } })
    await list.destroy()
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function reorderLists(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid project id' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const { order } = req.body // [{id, position}, ...]
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' })

    await Promise.all(order.map(item => ProjectList.update({ position: item.position }, { where: { id: item.id, project_id } })))
    res.status(200).json({ success: true })
  } catch (err) { next(err) }
}
