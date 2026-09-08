<template>
  <div class="glass-card-static p-5 relative overflow-hidden" 
       :class="{ 'border-accent-red/40': match.status === 'live' }">
    <!-- LIVE header bar -->
    <div v-if="match.status === 'live'" 
         class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-red via-accent-orange to-accent-red animate-shimmer"
         style="background-size: 200% 100%;"></div>

    <!-- Status -->
    <div class="flex items-center justify-between mb-4">
      <span v-if="match.status === 'live'" class="live-indicator">Live</span>
      <span v-else-if="match.status === 'completed'" class="badge-completed">Completed</span>
      <span v-else class="badge-scheduled">Scheduled</span>

      <span v-if="match.live_minute" class="text-sm font-heading font-bold text-white">
        {{ match.live_minute }}'
      </span>
    </div>

    <!-- Players & Score -->
    <div class="flex items-center justify-between gap-4">
      <!-- Player 1 -->
      <div class="flex-1 text-center">
        <div class="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
             :class="match.winner_id === match.player1_id 
               ? 'bg-gradient-neon text-pitch-950 shadow-neon-green' 
               : 'bg-glass-medium text-white'">
          {{ getInitial('player1') }}
        </div>
        <p class="text-sm font-semibold text-white truncate">{{ getPlayerName('player1') }}</p>
        <p v-if="match.player1?.favorite_club" class="text-xs text-gray-500">{{ match.player1.favorite_club }}</p>
      </div>

      <!-- Score -->
      <div class="text-center px-4">
        <div class="flex items-center gap-2">
          <span class="text-3xl font-heading font-black"
                :class="match.status !== 'scheduled' ? 'text-white' : 'text-gray-600'">
            {{ match.status !== 'scheduled' ? match.score1 : '-' }}
          </span>
          <span class="text-lg text-gray-600 font-light">:</span>
          <span class="text-3xl font-heading font-black"
                :class="match.status !== 'scheduled' ? 'text-white' : 'text-gray-600'">
            {{ match.status !== 'scheduled' ? match.score2 : '-' }}
          </span>
        </div>
        <p v-if="match.status === 'live'" class="text-xs text-accent-red font-semibold mt-1 animate-pulse">
          ● LIVE
        </p>
      </div>

      <!-- Player 2 -->
      <div class="flex-1 text-center">
        <div class="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
             :class="match.winner_id === match.player2_id 
               ? 'bg-gradient-neon text-pitch-950 shadow-neon-green' 
               : 'bg-glass-medium text-white'">
          {{ getInitial('player2') }}
        </div>
        <p class="text-sm font-semibold text-white truncate">{{ getPlayerName('player2') }}</p>
        <p v-if="match.player2?.favorite_club" class="text-xs text-gray-500">{{ match.player2.favorite_club }}</p>
      </div>
    </div>

    <!-- Live Notes -->
    <div v-if="match.live_notes && match.status === 'live'" class="mt-4 pt-3 border-t border-glass-border">
      <p class="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Commentary</p>
      <p class="text-sm text-gray-300">{{ match.live_notes }}</p>
    </div>

    <!-- Stream Link -->
    <div v-if="match.stream_url" class="mt-4 pt-3 border-t border-glass-border">
      <a :href="match.stream_url" target="_blank" rel="noopener"
         class="btn-neon-outline !py-2 !px-4 !text-xs w-full text-center block">
        📺 Watch Stream
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  match: any
}>()

function getPlayerName(slot: 'player1' | 'player2'): string {
  const player = props.match[slot]
  if (player && typeof player === 'object') {
    return player.display_name || player.username || 'Unknown'
  }
  return 'TBD'
}

function getInitial(slot: 'player1' | 'player2'): string {
  const name = getPlayerName(slot)
  return name === 'TBD' ? '?' : name[0].toUpperCase()
}
</script>
