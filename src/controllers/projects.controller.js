import { Project, ProjectMember, ProjectTask, ProjectList, User } from '../models/index.js'

export async function listMyProjects(req, res, next) {
  try {
    const userId = req.user.id
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          through: { attributes: ['role'] },
          where: { id: userId },
          attributes: [],
        },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      ],
      order: [['updated_at', 'DESC']],
    })
    res.json(projects.map(p => p.get({ plain: true })))
  } catch (err) {
    next(err)
  }
}

export async function createProject(req, res, next) {
  try {
    const userId = req.user.id
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const project = await Project.create({ owner_id: userId, name, description: description || null })
    await ProjectMember.create({ project_id: project.id, user_id: userId, role: 'owner' })

    // Seed default lists (columns)
    try {
      await ProjectList.bulkCreate([
        { project_id: project.id, title: 'To Do', position: 0 },
        { project_id: project.id, title: 'In Progress', position: 1 },
        { project_id: project.id, title: 'Done', position: 2 },
      ])
    } catch (e) {
      // non-blocking; log and continue
      console.warn('Failed to seed default lists for project', project.id, e?.message)
    }

    const full = await Project.findByPk(project.id, { include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }] })
    res.status(201).json(full.get({ plain: true }))
  } catch (err) {
    next(err)
  }
}

async function ensureMembership(project_id, user_id) {
  const mem = await ProjectMember.findOne({ where: { project_id, user_id } })
  return !!mem
}

export async function getProjectDetail(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const project = await Project.findByPk(project_id, {
      include: [
        { model: User, as: 'owner', attributes: ['id','name','email'] },
        { model: User, through: { attributes: ['role'] }, attributes: ['id','name','email'] },
      ]
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project.get({ plain: true }))
  } catch (err) {
    next(err)
  }
}

export async function addMember(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const { user_id, role } = req.body
    if (!project_id || !user_id) return res.status(400).json({ error: 'project_id and user_id required' })

    // only owner/admins can add
    const myMem = await ProjectMember.findOne({ where: { project_id, user_id: req.user.id } })
    if (!myMem || (myMem.role !== 'owner' && myMem.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const [member, created] = await ProjectMember.findOrCreate({
      where: { project_id, user_id },
      defaults: { role: role || 'member' }
    })
    if (!created && role && member.role !== role) {
      member.role = role
      await member.save()
    }
    res.status(created ? 201 : 200).json(member.get({ plain: true }))
  } catch (err) {
    next(err)
  }
}

export async function listProjectTasks(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const tasks = await ProjectTask.findAll({ where: { project_id }, order: [['created_at','DESC']] })
    res.json(tasks.map(t => t.get({ plain: true })))
  } catch (err) {
    next(err)
  }
}

export async function createTask(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const { title, description, assignee_id, due_date, status, list_id } = req.body
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })
    if (!title) return res.status(400).json({ error: 'title is required' })
    const ok = await ensureMembership(project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    // If list_id provided, ensure it belongs to the same project
    let listIdVal = list_id ?? null
    if (listIdVal !== null && listIdVal !== undefined) {
      const list = await ProjectList.findByPk(Number(listIdVal))
      if (!list || list.project_id !== project_id) {
        return res.status(400).json({ error: 'Invalid list_id for this project' })
      }
      listIdVal = Number(listIdVal)
    }

    const task = await ProjectTask.create({
      project_id,
      title,
      description: description || null,
      assignee_id: assignee_id || null,
      due_date: due_date || null,
      status: status || 'todo',
      list_id: listIdVal,
    })
    res.status(201).json(task.get({ plain: true }))
  } catch (err) {
    next(err)
  }
}

export async function updateTask(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    if (!taskId) return res.status(400).json({ error: 'Invalid taskId' })
    const task = await ProjectTask.findByPk(taskId)
    if (!task) return res.status(404).json({ error: 'Task not found' })
    const ok = await ensureMembership(task.project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })

    const { title, description, assignee_id, due_date, status, list_id } = req.body
    if (title !== undefined) task.title = title
    if (description !== undefined) task.description = description
    if (assignee_id !== undefined) task.assignee_id = assignee_id
    if (due_date !== undefined) task.due_date = due_date
    if (status !== undefined) task.status = status
    if (list_id !== undefined) {
      if (list_id === null) {
        task.list_id = null
      } else {
        const list = await ProjectList.findByPk(Number(list_id))
        if (!list || list.project_id !== task.project_id) {
          return res.status(400).json({ error: 'Invalid list_id for this project' })
        }
        task.list_id = Number(list_id)
      }
    }
    await task.save()
    res.json(task.get({ plain: true }))
  } catch (err) {
    next(err)
  }
}

export async function deleteTask(req, res, next) {
  try {
    const taskId = Number(req.params.taskId)
    if (!taskId) return res.status(400).json({ error: 'Invalid taskId' })
    const task = await ProjectTask.findByPk(taskId)
    if (!task) return res.status(404).json({ error: 'Task not found' })
    const ok = await ensureMembership(task.project_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Forbidden' })
    await task.destroy()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// ---------- Members Management ----------
export async function listMembers(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })
    const mem = await ProjectMember.findOne({ where: { project_id, user_id: req.user.id } })
    if (!mem) return res.status(403).json({ error: 'Forbidden' })

    const rows = await ProjectMember.findAll({
      where: { project_id },
      include: [{ model: User, attributes: ['id','name','email'] }],
      order: [['added_at','ASC']]
    })
    const members = rows.map(r => ({ user_id: r.user_id, role: r.role, added_at: r.added_at, user: r.User?.get({ plain: true }) }))
    res.json(members)
  } catch (err) { next(err) }
}

export async function inviteByEmail(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const { email, role } = req.body
    if (!project_id || !email) return res.status(400).json({ error: 'project_id and email required' })

    const me = await ProjectMember.findOne({ where: { project_id, user_id: req.user.id } })
    if (!me || (me.role !== 'owner' && me.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' })

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const [member, created] = await ProjectMember.findOrCreate({
      where: { project_id, user_id: user.id },
      defaults: { role: role || 'member' }
    })
    if (!created && role && member.role !== role) {
      member.role = role
      await member.save()
    }
    res.status(created ? 201 : 200).json({ user_id: user.id, role: member.role })
  } catch (err) { next(err) }
}

export async function changeMemberRole(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const targetUserId = Number(req.params.userId)
    const { role } = req.body
    if (!project_id || !targetUserId || !role) return res.status(400).json({ error: 'project_id, userId and role required' })

    const me = await ProjectMember.findOne({ where: { project_id, user_id: req.user.id } })
    if (!me || (me.role !== 'owner' && me.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' })

    const member = await ProjectMember.findOne({ where: { project_id, user_id: targetUserId } })
    if (!member) return res.status(404).json({ error: 'Member not found' })

    member.role = role
    await member.save()
    res.json({ user_id: member.user_id, role: member.role })
  } catch (err) { next(err) }
}

export async function removeMember(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const targetUserId = Number(req.params.userId)
    if (!project_id || !targetUserId) return res.status(400).json({ error: 'Invalid id' })

    const me = await ProjectMember.findOne({ where: { project_id, user_id: req.user.id } })
    if (!me || (me.role !== 'owner' && me.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' })

    const member = await ProjectMember.findOne({ where: { project_id, user_id: targetUserId } })
    if (!member) return res.status(404).json({ error: 'Member not found' })

    await ProjectMember.destroy({ where: { project_id, user_id: targetUserId } })
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function leaveProject(req, res, next) {
  try {
    const project_id = Number(req.params.id)
    const user_id = req.user.id
    if (!project_id) return res.status(400).json({ error: 'Invalid id' })

    const membership = await ProjectMember.findOne({ where: { project_id, user_id } })
    if (!membership) return res.status(404).json({ error: 'Not a project member' })

    if (membership.role !== 'owner') {
      await ProjectMember.destroy({ where: { project_id, user_id } })
      return res.status(204).send()
    }

    const membersCount = await ProjectMember.count({ where: { project_id } })
    if (membersCount > 1) {
      return res.status(400).json({ error: 'Owner must transfer ownership before leaving the project' })
    }

    await Project.destroy({ where: { id: project_id } })
    return res.status(204).send()
  } catch (err) { next(err) }
}
