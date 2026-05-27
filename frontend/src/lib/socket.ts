import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token?: string): Socket => {
  if (!socket || !socket.connected) {
    const socketUrl = import.meta.env.DEV ? '/' : (import.meta.env.VITE_API_URL || '/')
    socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }
  return socket
}


export const connectSocket = (token: string) => {
  const s = getSocket(token)
  if (!s.connected) {
    s.auth = { token }
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}

export default getSocket
