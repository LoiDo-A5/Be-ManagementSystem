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
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('todo','in_progress','done'), defaultValue: 'todo', allowNull: false },
  assignee_id: { type: DataTypes.INTEGER, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
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

// Associations
User.hasMany(Todo, { foreignKey: 'user_id' })
Todo.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Project, { foreignKey: 'owner_id', as: 'ownedProjects' })
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' })

User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', otherKey: 'project_id' })
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', otherKey: 'user_id' })

Project.hasMany(ProjectTask, { foreignKey: 'project_id' })
ProjectTask.belongsTo(Project, { foreignKey: 'project_id' })

User.hasMany(ProjectTask, { foreignKey: 'assignee_id', as: 'assignedTasks' })
ProjectTask.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' })

ProjectTask.hasMany(TaskComment, { foreignKey: 'task_id' })
TaskComment.belongsTo(ProjectTask, { foreignKey: 'task_id' })

User.hasMany(TaskComment, { foreignKey: 'user_id' })
TaskComment.belongsTo(User, { foreignKey: 'user_id' })

export default sequelize
