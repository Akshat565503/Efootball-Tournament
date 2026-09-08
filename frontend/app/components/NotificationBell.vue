<template>
  <div class="relative" ref="bellRef">
    <button @click="toggleDropdown" 
            class="relative p-2 rounded-lg hover:bg-glass-light transition-all duration-200 group">
      <!-- Bell Icon -->
      <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Unread Badge -->
      <Transition name="bounce">
        <span v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent-red text-white text-[10px] 
                     font-bold flex items-center justify-center animate-bounce-subtle"
              style="background: #ff3366;">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </Transition>
    </button>

    <!-- Dropdown -->
    <Transition name="slide-down">
      <div v-if="isOpen" 
           class="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card-static overflow-hidden z-50"
           style="max-height: 480px;">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-glass-border">
          <h3 class="font-heading font-semibold text-white text-sm">Notifications</h3>
          <button v-if="unreadCount > 0" @click="markAllAsRead" 
                  class="text-xs text-neon-green hover:text-neon-blue transition-colors">
            Mark all read
          </button>
        </div>

        <!-- Notification List -->
        <div class="overflow-y-auto" style="max-height: 400px;">
          <div v-if="notifications.length === 0" 
               class="px-4 py-8 text-center text-gray-500 text-sm">
            No notifications yet
          </div>

          <div v-for="notification in notifications" :key="notification.id"
               @click="handleNotificationClick(notification)"
               class="px-4 py-3 border-b border-glass-border cursor-pointer transition-all duration-200 hover:bg-glass-light"
               :class="{ 'bg-glass-light/50': !notification.read }">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                   :class="getNotificationIconClass(notification.type)">
                <span class="text-sm">{{ getNotificationIcon(notification.type) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ notification.title }}</p>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                <p class="text-xs text-gray-600 mt-1">{{ formatTime(notification.created_at) }}</p>
              </div>

              <!-- Unread dot -->
              <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-neon-green flex-shrink-0 mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, setupRealtimeNotifications } = useNotifications()

const isOpen = ref(false)
const bellRef = ref<HTMLElement>()

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchNotifications()
  }
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    match_upcoming: '⏰',
    match_live: '🔴',
    match_result: '📊',
    round_complete: '🏅',
    tournament_started: '🏆',
    tournament_completed: '🎉',
    player_joined: '👋',
    you_advanced: '🚀',
    you_eliminated: '💔',
  }
  return icons[type] || '📢'
}

function getNotificationIconClass(type: string): string {
  const classes: Record<string, string> = {
    you_advanced: 'bg-neon-green/20',
    you_eliminated: 'bg-accent-red/20',
    match_live: 'bg-red-500/20',
    tournament_started: 'bg-accent-gold/20',
    tournament_completed: 'bg-neon-blue/20',
  }
  return classes[type] || 'bg-glass-light'
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

function handleNotificationClick(notification: any) {
  if (!notification.read) {
    markAsRead(notification.id)
  }
  if (notification.tournament_id) {
    navigateTo(`/tournaments/${notification.tournament_id}`)
    isOpen.value = false
  }
}

// Close on click outside
function handleClickOutside(event: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  setupRealtimeNotifications()
  fetchNotifications()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}
.bounce-enter-active { animation: bounceIn 0.3s ease; }
.bounce-leave-active { animation: bounceIn 0.3s ease reverse; }
@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
