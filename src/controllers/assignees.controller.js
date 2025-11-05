import { ProjectMember, ProjectTask, TaskAssignee, User } from '../models/index.js'
import { notifyUser } from '../ws.js'

// Helper function to log requests
function logRequest(req, message) {
  console.log(`[${new Date().toISOString()}] [${req.method} ${req.originalUrl}] ${message}`)
  console.log('Request params:', req.params)
  console.log('Request body:', req.body)
  console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'No user')
}

async function ensureTaskMembership(task_id, user_id) {
  console.log(`[ensureTaskMembership] Checking membership for task ${task_id} and user ${user_id}`)
  
  try {
    const task = await ProjectTask.findByPk(task_id)
    console.log(`[ensureTaskMembership] Task found:`, task ? `ID: ${task.id}, Project ID: ${task.project_id}` : 'Not found')
    
    if (!task) {
      console.error(`[ensureTaskMembership] Task ${task_id} not found`)
      return { ok: false, status: 404, error: 'Task not found' }
    }
    
    const mem = await ProjectMember.findOne({ 
      where: { 
        project_id: task.project_id, 
        user_id 
      } 
    })
    
    console.log(`[ensureTaskMembership] Membership check result:`, mem ? 'Found' : 'Not found')
    
    if (!mem) {
      console.error(`[ensureTaskMembership] User ${user_id} is not a member of project ${task.project_id}`)
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    
    return { ok: true, task }
  } catch (error) {
    console.error('[ensureTaskMembership] Error:', {
      message: error.message,
      stack: error.stack,
      task_id,
      user_id
    })
    throw error
  }
}

export async function listAssignees(req, res, next) {
  const startTime = Date.now()
  const taskId = Number(req.params.taskId)
  
  logRequest(req, `Fetching assignees for task ${taskId}`)
  
  try {
    console.log(`[listAssignees] Starting for task ${taskId}`)
    
    // Check membership
    console.log(`[listAssignees] Checking membership for user ${req.user.id}`)
    const test = await ensureTaskMembership(taskId, req.user.id)
    
    if (!test.ok) {
      console.error(`[listAssignees] Membership check failed:`, test.error)
      return res.status(test.status).json({ 
        error: test.error,
        timestamp: new Date().toISOString(),
        taskId,
        userId: req.user.id
      })
    }
    
    console.log(`[listAssignees] Fetching assignees from database`)
    
    // Find all assignees
    const rows = await TaskAssignee.findAll({ 
      where: { task_id: taskId }, 
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      raw: true,
      nest: true
    })
    
    console.log(`[listAssignees] Found ${rows.length} assignees`)
    
    // Process the data
    const data = rows.map(r => {
      const userData = r.user || null
      console.log(`[listAssignees] Processing assignee:`, { 
        taskId: r.task_id, 
        userId: r.user_id,
        userData
      })
      
      return {
        user_id: r.user_id,
        user: userData
      }
    })
    
    const responseTime = Date.now() - startTime
    console.log(`[listAssignees] Sending response (${responseTime}ms):`, data)
    
    res.json({
      success: true,
      data,
      meta: {
        count: data.length,
        responseTime: `${responseTime}ms`
      }
    })
    
  } catch (err) { 
    console.error(`[listAssignees] Error:`, {
      message: err.message,
      stack: err.stack,
      taskId,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    })
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
      timestamp: new Date().toISOString()
    })
  }
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
    // Notify the assigned user via websocket (if connected)
    try {
      notifyUser(user_id, 'task_assigned', {
        task_id: taskId,
        project_id: test.task.project_id,
        title: (await ProjectTask.findByPk(taskId))?.title || undefined,
        assigned_by: req.user.id,
        timestamp: new Date().toISOString(),
      })
    } catch {}
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
