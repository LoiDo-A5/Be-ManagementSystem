import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'

let io = null
const userSockets = new Map() // userId -> Set<sockets>

export function initWebsocket(server) {
  try {
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: false,
      },
    })

    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token
        if (!token) return next(new Error('Unauthorized'))
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
        socket.userId = payload.id
        return next()
      } catch (e) {
        return next(new Error('Unauthorized'))
      }
    })

    io.on('connection', (socket) => {
      const uid = socket.userId
      if (!userSockets.has(uid)) userSockets.set(uid, new Set())
      userSockets.get(uid).add(socket)

      socket.on('disconnect', () => {
        const set = userSockets.get(uid)
        if (set) {
          set.delete(socket)
          if (set.size === 0) userSockets.delete(uid)
        }
      })
    })
  } catch (err) {
    console.warn('[ws] socket.io not initialized:', err?.message)
  }
}

export function notifyUser(userId, event, payload) {
  try {
    const set = userSockets.get(Number(userId))
    if (!set) return
    for (const sock of set) {
      sock.emit(event, payload)
    }
  } catch {}
}

export function getIO() { return io }
