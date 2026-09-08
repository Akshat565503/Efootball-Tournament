<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-4xl mx-auto" v-if="profileData">
      <!-- Profile Header -->
      <div class="glass-card-static p-8 mb-8 relative overflow-hidden">
        <!-- Background glow -->
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
             style="background: radial-gradient(circle, rgba(57,255,20,0.4) 0%, transparent 70%);"></div>

        <div class="flex items-start gap-6 flex-wrap relative z-10">
          <!-- Avatar -->
          <div class="w-20 h-20 rounded-2xl bg-gradient-neon flex items-center justify-center text-pitch-950 
                      font-heading font-black text-3xl shadow-neon-green flex-shrink-0">
            {{ profileData.profile.display_name?.[0] || profileData.profile.username?.[0] || '?' }}
          </div>

          <div class="flex-1 min-w-0">
            <h1 class="font-heading font-bold text-2xl text-white mb-1">
              {{ profileData.profile.display_name || profileData.profile.username }}
            </h1>
            <p class="text-gray-500 text-sm mb-3">@{{ profileData.profile.username }}</p>

            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span v-if="profileData.profile.favorite_club" class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-glass-light border border-glass-border text-gray-300 text-xs">
                ⚽ {{ profileData.profile.favorite_club }}
              </span>
              <span v-if="profileData.profile.region" class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-glass-light border border-glass-border text-gray-300 text-xs">
                🌍 {{ profileData.profile.region }}
              </span>
              <div v-if="profileData.profile.efootball_id" class="flex items-center gap-2 px-3 py-1 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono">
                <span>🎮 {{ profileData.profile.efootball_id }}</span>
                <button @click="copyText(profileData.profile.efootball_id)" class="text-[10px] uppercase font-bold text-white hover:underline">
                  Copy
                </button>
              </div>
            </div>

            <p v-if="profileData.profile.bio" class="text-gray-400 text-sm mt-3">{{ profileData.profile.bio }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card-static p-5 text-center">
          <p class="text-3xl font-heading font-black text-gradient-neon">{{ stats.matches_played }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Matches</p>
        </div>
        <div class="glass-card-static p-5 text-center">
          <p class="text-3xl font-heading font-black text-neon-green">{{ stats.wins }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Wins</p>
        </div>
        <div class="glass-card-static p-5 text-center">
          <p class="text-3xl font-heading font-black text-accent-red">{{ stats.losses }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Losses</p>
        </div>
        <div class="glass-card-static p-5 text-center">
          <p class="text-3xl font-heading font-black text-accent-gold">{{ stats.win_rate }}%</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Win Rate</p>
        </div>
      </div>

      <!-- Additional stats -->
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="glass-card-static p-5 text-center">
          <p class="text-2xl font-heading font-black text-neon-blue">{{ stats.tournaments_played }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Tournaments Played</p>
        </div>
        <div class="glass-card-static p-5 text-center">
          <p class="text-2xl font-heading font-black text-accent-gold">{{ stats.tournaments_won }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">🏆 Tournaments Won</p>
        </div>
      </div>

      <!-- Win Rate Bar -->
      <div v-if="stats.matches_played > 0" class="glass-card-static p-5 mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-400">Win Rate</span>
          <span class="text-sm font-bold text-white">{{ stats.win_rate }}%</span>
        </div>
        <div class="h-3 rounded-full bg-glass-light overflow-hidden">
          <div class="h-full rounded-full bg-gradient-neon transition-all duration-1000"
               :style="{ width: `${stats.win_rate}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="max-w-4xl mx-auto pt-24">
      <div class="animate-pulse space-y-6">
        <div class="glass-card-static p-8 flex gap-6">
          <div class="w-20 h-20 rounded-2xl bg-glass-light"></div>
          <div class="flex-1 space-y-3">
            <div class="h-6 bg-glass-light rounded w-1/3"></div>
            <div class="h-4 bg-glass-light rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="text-center pt-24 text-gray-500">
      <p class="text-5xl mb-4">😔</p>
      <p class="text-lg font-heading font-semibold">Player not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { fetchPublicProfile } = useTournament()

const profileData = ref<any>(null)
const loading = ref(true)

const stats = computed(() => profileData.value?.stats || {
  matches_played: 0, wins: 0, losses: 0, win_rate: 0,
  tournaments_played: 0, tournaments_won: 0,
})

onMounted(async () => {
  try {
    profileData.value = await fetchPublicProfile(route.params.username as string)
  } catch (e) {
    console.error('Failed to load profile:', e)
  } finally {
    loading.value = false
  }
})

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

useHead({ title: computed(() => profileData.value?.profile?.display_name 
  ? `${profileData.value.profile.display_name} — eFootball Arena` 
  : 'Player Profile — eFootball Arena') })
</script>
