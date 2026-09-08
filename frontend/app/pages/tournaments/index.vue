<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="font-heading font-bold text-3xl sm:text-4xl text-white mb-3">
          Browse <span class="text-gradient-neon">Tournaments</span>
        </h1>
        <p class="text-gray-500">Find your next challenge</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <button v-for="filter in statusFilters" :key="filter.value"
                @click="activeStatus = filter.value"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                :class="activeStatus === filter.value 
                  ? 'bg-gradient-neon text-pitch-950 font-semibold shadow-neon-green' 
                  : 'bg-glass-light text-gray-400 hover:text-white hover:bg-glass-medium border border-glass-border'">
          {{ filter.label }}
        </button>

        <div class="flex-1 min-w-[200px] ml-auto max-w-sm">
          <input v-model="searchQuery" 
                 type="text"
                 placeholder="Search tournaments..."
                 class="input-glass !py-2 text-sm" />
        </div>
      </div>

      <!-- Tournament Grid -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="glass-card-static p-5 animate-pulse">
          <div class="h-36 rounded-xl bg-glass-light mb-4"></div>
          <div class="h-5 bg-glass-light rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-glass-light rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="tournaments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TournamentCard v-for="tournament in tournaments" :key="tournament.id" :tournament="tournament" />
      </div>

      <div v-else class="text-center py-20 glass-card-static">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-gray-400 text-lg font-heading font-semibold mb-2">No tournaments found</p>
        <p class="text-gray-600 text-sm mb-6">Try adjusting your filters or create a new one</p>
        <NuxtLink to="/tournaments/create" class="btn-neon">Create Tournament</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetchTournaments } = useTournament()

const tournaments = ref<any[]>([])
const loading = ref(true)
const activeStatus = ref('all')
const searchQuery = ref('')

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

async function loadTournaments() {
  loading.value = true
  try {
    tournaments.value = await fetchTournaments({
      status: activeStatus.value === 'all' ? undefined : activeStatus.value,
      search: searchQuery.value || undefined,
      limit: 20,
    })
  } catch (error) {
    console.error('Failed to load tournaments:', error)
  } finally {
    loading.value = false
  }
}

watch([activeStatus, searchQuery], () => {
  loadTournaments()
})

onMounted(() => {
  loadTournaments()
})

useHead({ title: 'Browse Tournaments — eFootball Arena' })
</script>
