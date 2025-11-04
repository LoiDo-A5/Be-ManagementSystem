import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import todoRoutes from './routes/todos.routes.js'
import projectRoutes from './routes/projects.routes.js'
import listRoutes from './routes/lists.routes.js'
import commentRoutes from './routes/comments.routes.js'
import attachmentRoutes from './routes/attachments.routes.js'
import settingsRoutes from './routes/settings.routes.js'
import labelsRoutes from './routes/labels.routes.js'
import checklistRoutes from './routes/checklist.routes.js'
import assigneesRoutes from './routes/assignees.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Static files for uploads
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/', (req, res) => {
  res.json({ message: 'BeToDoList API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api', listRoutes)
app.use('/api', commentRoutes)
app.use('/api', attachmentRoutes)
app.use('/api', settingsRoutes)
app.use('/api', labelsRoutes)
app.use('/api', checklistRoutes)
app.use('/api', assigneesRoutes)

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  })
})

export default app
