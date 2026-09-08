const notifications = ref<any[]>([])
const unreadCount = ref(0)
const loading = ref(false)

export function useNotifications() {
  const config = useRuntimeConfig()
  const { getAccessToken, isAuthenticated } = useAuth()
  const { onNotification, connect } = useSocket()

  async function fetchNotifications() {
    if (!isAuthenticated.value) return

    loading.value = true
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await $fetch(`${config.public.apiBase}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      notifications.value = (response as any).notifications || []
      unreadCount.value = (response as any).unread_count || 0
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    const token = await getAccessToken()
    if (!token) return

    try {
      await $fetch(`${config.public.apiBase}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification && !notification.read) {
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function markAllAsRead() {
    const token = await getAccessToken()
    if (!token) return

    try {
      await $fetch(`${config.public.apiBase}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })

      notifications.value.forEach((n) => (n.read = true))
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  function setupRealtimeNotifications() {
    connect()
    onNotification((notification: any) => {
      notifications.value.unshift(notification)
      unreadCount.value++
    })
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeNotifications,
  }
}
