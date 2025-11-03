import dotenv from 'dotenv'
import app from './app.js'
import sequelize from './models/index.js'

dotenv.config()

const PORT = process.env.PORT || 3000

// Initialize Postgres via Sequelize, then start server
try {
  await sequelize.authenticate()
  const alter = process.env.SEQ_ALTER === 'true'
  await sequelize.sync({ alter })
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
} catch (err) {
  console.error('Failed to start server due to DB error:', err)
  process.exit(1)
}
