import dotenv from 'dotenv'
import app from './app.js'
import http from 'http'
import { initWebsocket } from './ws.js'
import sequelize from './models/index.js'

dotenv.config()

const PORT = process.env.PORT || 3000

async function cleanupDuplicates() {
  try {
    await sequelize.query(`
      WITH ranked AS (
        SELECT id, project_id, title,
               ROW_NUMBER() OVER (PARTITION BY project_id, title ORDER BY id) AS rn
        FROM project_lists
      )
      DELETE FROM project_lists pl
      USING ranked r
      WHERE pl.id = r.id AND r.rn > 1;
    `)
    console.log('Deduped duplicate project_lists rows (if any).')
  } catch (e) {
    if (e?.original?.code === '42P01') return
    console.warn('Skipping project_lists dedupe:', e.message || e)
  }
}

try {
  await sequelize.authenticate()
  await cleanupDuplicates()
  const alter = process.env.SEQ_ALTER === 'true'
  await sequelize.sync({ alter })
  const server = http.createServer(app)
  initWebsocket(server)
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
} catch (err) {
  console.error('Failed to start server due to DB error:', err)
  process.exit(1)
}
