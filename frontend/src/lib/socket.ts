import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    // In dev, connect directly to backend. In prod, use VITE_API_URL
    // (Don't use vite proxy because websocket proxying can be tricky)
    const socketUrl = import.meta.env.DEV 
      ? 'http://localhost:5000' 
      : (import.meta.env.VITE_API_URL || window.location.origin)
    
    console.log('🔌 Creating socket connection to:', socketUrl, 'DEV:', import.meta.env.DEV)
    
    socket = io(socketUrl, {
      auth: { token: token || '' },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
    })

    // Global socket event listeners
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id)
    })
    
    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected. Reason:', reason)
    })
    
    socket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error)
    })
  }
  return socket
}


export const connectSocket = (token: string) => {
  const s = getSocket(token)
  if (!s.connected) {
    console.log('🔄 Connecting socket with token...', 'Socket ID:', s.id)
    s.auth = { token }
    s.connect()
  } else {
    console.log('✅ Socket already connected, id:', s.id)
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
