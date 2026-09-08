import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
const connected = ref(false)

export function useSocket() {
  const config = useRuntimeConfig()
  const { getAccessToken } = useAuth()

  function connect() {
    if (socket?.connected) return socket

    socket = io(config.public.apiBase as string, {
      auth: async (cb: (data: Record<string, any>) => void) => {
        const token = await getAccessToken()
        cb(token ? { token } : {})
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      connected.value = true
      console.log('⚡ Socket connected')
    })

    socket.on('disconnect', (reason) => {
      connected.value = false
      console.log('⚡ Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('⚡ Socket connection error:', error.message)
    })

    return socket
  }

  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }
  }

  function joinTournamentRoom(tournamentId: string) {
    if (!socket?.connected) connect()
    socket?.emit('tournament:join_room', tournamentId)
  }

  function leaveTournamentRoom(tournamentId: string) {
    socket?.emit('tournament:leave_room', tournamentId)
  }

  function onMatchUpdated(callback: (match: any) => void) {
    socket?.on('match:updated', callback)
    return () => socket?.off('match:updated', callback)
  }

  function onMatchLiveNote(callback: (data: any) => void) {
    socket?.on('match:live_note', callback)
    return () => socket?.off('match:live_note', callback)
  }

  function onBracketUpdated(callback: (data: any) => void) {
    socket?.on('tournament:bracket_updated', callback)
    return () => socket?.off('tournament:bracket_updated', callback)
  }

  function onRoundComplete(callback: (data: any) => void) {
    socket?.on('tournament:round_complete', callback)
    return () => socket?.off('tournament:round_complete', callback)
  }

  function onTournamentStatusChanged(callback: (data: any) => void) {
    socket?.on('tournament:status_changed', callback)
    return () => socket?.off('tournament:status_changed', callback)
  }

  function onParticipantJoined(callback: (data: any) => void) {
    socket?.on('participant:joined', callback)
    return () => socket?.off('participant:joined', callback)
  }

  function onNotification(callback: (notification: any) => void) {
    socket?.on('notification:new', callback)
    return () => socket?.off('notification:new', callback)
  }

  function getSocket(): Socket | null {
    return socket
  }

  return {
    connected: readonly(connected),
    connect,
    disconnect,
    joinTournamentRoom,
    leaveTournamentRoom,
    onMatchUpdated,
    onMatchLiveNote,
    onBracketUpdated,
    onRoundComplete,
    onTournamentStatusChanged,
    onParticipantJoined,
    onNotification,
    getSocket,
  }
}
