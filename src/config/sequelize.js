import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

console.log('PG_USER:', process.env.PG_USER)
console.log('PG_DB:', process.env.PG_DB)
console.log('PG_PASSWORD set?', typeof process.env.PG_PASSWORD, !!process.env.PG_PASSWORD)

const sequelize = new Sequelize(
  process.env.PG_DB || 'team_management',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT || 5432),
    dialect: 'postgres',
    logging: process.env.SEQ_LOG === 'true' ? console.log : false,
  }
)

export default sequelize
