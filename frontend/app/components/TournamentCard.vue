<template>
  <NuxtLink :to="`/tournaments/${tournament.id}`" class="glass-card block p-5 group">
    <!-- Banner -->
    <div class="relative h-36 rounded-xl overflow-hidden mb-4 bg-gradient-stadium">
      <img v-if="tournament.banner_url" :src="tournament.banner_url" :alt="tournament.name"
           class="w-full h-full object-cover" />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <span class="text-5xl opacity-30">⚽</span>
      </div>
      <!-- Overlay gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-pitch-950/80 to-transparent"></div>

      <!-- Status Badge -->
      <div class="absolute top-3 right-3">
        <span :class="statusBadgeClass">{{ statusLabel }}</span>
      </div>

      <!-- Theme tag -->
      <div v-if="tournament.theme" class="absolute bottom-3 left-3">
        <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-pitch-950/70 text-accent-gold 
                     border border-accent-gold/30 backdrop-blur-sm">
          {{ tournament.theme }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <h3 class="font-heading font-bold text-white text-lg mb-1.5 group-hover:text-gradient-neon transition-all line-clamp-1">
      {{ tournament.name }}
    </h3>

    <p v-if="tournament.description" class="text-gray-500 text-sm mb-3 line-clamp-2">
      {{ tournament.description }}
    </p>

    <!-- Meta -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Player count -->
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-xs text-gray-400">
            <span class="text-white font-semibold">{{ participantCount }}</span>/{{ tournament.max_players }}
          </span>
        </div>

        <!-- Ruleset -->
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="text-xs text-gray-400">{{ tournament.ruleset }}</span>
        </div>
      </div>

      <!-- Owner avatar -->
      <div v-if="tournament.owner" class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-gradient-neon flex items-center justify-center text-pitch-950 text-xs font-bold">
          {{ tournament.owner.display_name?.[0] || tournament.owner.username?.[0] || '?' }}
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  tournament: any
}>()

const participantCount = computed(() => {
  if (props.tournament.participant_count !== undefined) {
    return Array.isArray(props.tournament.participant_count)
      ? props.tournament.participant_count[0]?.count || 0
      : props.tournament.participant_count
  }
  return props.tournament.participants?.length || 0
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[props.tournament.status] || props.tournament.status
})

const statusBadgeClass = computed(() => {
  const classes: Record<string, string> = {
    open: 'badge-open',
    in_progress: 'badge-in-progress',
    completed: 'badge-completed',
    draft: 'badge-scheduled',
    cancelled: 'badge',
  }
  return classes[props.tournament.status] || 'badge'
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
