import { DataTypes } from 'sequelize'
import sequelize from '../config/sequelize.js'

// User
export const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Todo (to keep existing endpoints working during migration)
export const Todo = sequelize.define('Todo', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
  completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'todos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Projects
export const Project = sequelize.define('Project', {
  owner_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING(20), allowNull: true },
  background_url: { type: DataTypes.STRING(500), allowNull: true },
  archived_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Project Members (through)
export const ProjectMember = sequelize.define('ProjectMember', {
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('owner','admin','member'), allowNull: false, defaultValue: 'member' },
  added_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'project_members',
  timestamps: false,
})

// Project Tasks
export const ProjectTask = sequelize.define('ProjectTask', {
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  list_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('todo','in_progress','done'), defaultValue: 'todo', allowNull: false },
  assignee_id: { type: DataTypes.INTEGER, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
  priority: { type: DataTypes.ENUM('low','medium','high'), allowNull: false, defaultValue: 'medium' },
  reminder_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'project_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Task Comments
export const TaskComment = sequelize.define('TaskComment', {
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'task_comments',
  timestamps: false,
})

// Project Lists (Columns)
export const ProjectList = sequelize.define('ProjectList', {
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'project_lists',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'title']
    }
  ]
})

// Task Attachments
export const TaskAttachment = sequelize.define('TaskAttachment', {
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  file_url: { type: DataTypes.STRING(500), allowNull: false },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'task_attachments',
  timestamps: false,
})

// Task Labels
export const TaskLabel = sequelize.define('TaskLabel', {
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  color: { type: DataTypes.STRING(20), allowNull: false },
}, {
  tableName: 'task_labels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

export const TaskLabelMap = sequelize.define('TaskLabelMap', {
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  label_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'task_label_map',
  timestamps: false,
})

// Checklist
export const TaskChecklist = sequelize.define('TaskChecklist', {
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
}, {
  tableName: 'task_checklists',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

export const TaskChecklistItem = sequelize.define('TaskChecklistItem', {
  checklist_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'task_checklist_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Multiple Assignees
export const TaskAssignee = sequelize.define('TaskAssignee', {
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'task_assignees',
  timestamps: false,
})

// Associations
User.hasMany(Todo, { foreignKey: 'user_id' })
Todo.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Project, { foreignKey: 'owner_id', as: 'ownedProjects' })
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' })

User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', otherKey: 'project_id' })
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', otherKey: 'user_id' })

// Allow includes on ProjectMember <-> User
User.hasMany(ProjectMember, { foreignKey: 'user_id' })
ProjectMember.belongsTo(User, { foreignKey: 'user_id' })

Project.hasMany(ProjectTask, { foreignKey: 'project_id' })
ProjectTask.belongsTo(Project, { foreignKey: 'project_id' })

Project.hasMany(ProjectList, { foreignKey: 'project_id' })
ProjectList.belongsTo(Project, { foreignKey: 'project_id' })

ProjectList.hasMany(ProjectTask, { foreignKey: 'list_id' })
ProjectTask.belongsTo(ProjectList, { foreignKey: 'list_id' })

User.hasMany(ProjectTask, { foreignKey: 'assignee_id', as: 'assignedTasks' })
ProjectTask.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' })

ProjectTask.hasMany(TaskComment, { foreignKey: 'task_id' })
TaskComment.belongsTo(ProjectTask, { foreignKey: 'task_id' })

User.hasMany(TaskComment, { foreignKey: 'user_id' })
TaskComment.belongsTo(User, { foreignKey: 'user_id' })

ProjectTask.hasMany(TaskAttachment, { foreignKey: 'task_id' })
TaskAttachment.belongsTo(ProjectTask, { foreignKey: 'task_id' })

// Labels associations
Project.hasMany(TaskLabel, { foreignKey: 'project_id' })
TaskLabel.belongsTo(Project, { foreignKey: 'project_id' })
TaskLabel.belongsToMany(ProjectTask, { through: TaskLabelMap, foreignKey: 'label_id', otherKey: 'task_id' })
ProjectTask.belongsToMany(TaskLabel, { through: TaskLabelMap, foreignKey: 'task_id', otherKey: 'label_id' })

// Checklist associations
ProjectTask.hasMany(TaskChecklist, { foreignKey: 'task_id' })
TaskChecklist.belongsTo(ProjectTask, { foreignKey: 'task_id' })
TaskChecklist.hasMany(TaskChecklistItem, { foreignKey: 'checklist_id' })
TaskChecklistItem.belongsTo(TaskChecklist, { foreignKey: 'checklist_id' })

// Multiple assignees
ProjectTask.belongsToMany(User, { through: TaskAssignee, foreignKey: 'task_id', otherKey: 'user_id', as: 'assignees' })
User.belongsToMany(ProjectTask, { through: TaskAssignee, foreignKey: 'user_id', otherKey: 'task_id', as: 'assignedTo' })

export default sequelize
