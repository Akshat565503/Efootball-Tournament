<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <!-- 3D Scene Background -->
      <div class="absolute inset-0 z-0">
        <ClientOnly>
          <HeroScene />
        </ClientOnly>
        <!-- Gradient overlay for readability -->
        <div class="absolute inset-0 bg-gradient-to-b from-pitch-950/40 via-pitch-950/60 to-pitch-950 z-10"></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-20 text-center px-4 max-w-4xl mx-auto pt-20">
        <div class="animate-slide-up">
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6
                       bg-neon-green/10 text-neon-green border border-neon-green/20">
            Community Tournament Platform
          </span>

          <h1 class="font-heading font-black text-4xl sm:text-5xl md:text-7xl text-white leading-tight mb-6">
            Compete. Dominate.
            <br />
            <span class="text-gradient-neon">Claim the Trophy.</span>
          </h1>

          <p class="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate platform for hosting eFootball™ knockout tournaments.
            Create brackets, go live, and crown your community champion — all in one place.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink to="/tournaments" class="btn-neon !px-8 !py-4 !text-base">
              Browse Tournaments
            </NuxtLink>
            <NuxtLink to="/tournaments/create" class="btn-neon-outline !px-8 !py-4 !text-base">
              Create Tournament
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce-subtle">
        <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-24 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
            How It <span class="text-gradient-neon">Works</span>
          </h2>
          <p class="text-gray-500 max-w-xl mx-auto">
            From creation to champion — everything you need to run a tournament
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="(step, i) in howItWorks" :key="i"
               class="glass-card-static p-8 text-center group hover:border-neon-green/30 transition-all duration-300">
            <div class="w-16 h-16 rounded-2xl bg-gradient-neon mx-auto mb-6 flex items-center justify-center
                        text-pitch-950 text-2xl font-heading font-black group-hover:shadow-neon-green transition-shadow duration-300">
              {{ step.icon }}
            </div>
            <h3 class="font-heading font-bold text-white text-lg mb-3">{{ step.title }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Tournaments -->
    <section class="py-24 px-4 bg-midnight/50">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="font-heading font-bold text-3xl text-white mb-2">
              Featured <span class="text-gradient-gold">Tournaments</span>
            </h2>
            <p class="text-gray-500">Join an open tournament or spectate live action</p>
          </div>
          <NuxtLink to="/tournaments" class="btn-glass !py-2 hidden sm:inline-flex">
            View All →
          </NuxtLink>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="glass-card-static p-5 animate-pulse">
            <div class="h-36 rounded-xl bg-glass-light mb-4"></div>
            <div class="h-5 bg-glass-light rounded w-3/4 mb-3"></div>
            <div class="h-4 bg-glass-light rounded w-1/2"></div>
          </div>
        </div>

        <div v-else-if="tournaments.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TournamentCard v-for="tournament in tournaments" :key="tournament.id" :tournament="tournament" />
        </div>

        <div v-else class="text-center py-16 glass-card-static">
          <p class="text-4xl mb-4">🏆</p>
          <p class="text-gray-500 text-lg font-heading font-semibold mb-2">No tournaments yet</p>
          <p class="text-gray-600 text-sm mb-6">Be the first to create one!</p>
          <NuxtLink to="/tournaments/create" class="btn-neon">Create Tournament</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-24 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <p class="font-heading font-black text-3xl sm:text-4xl text-gradient-neon mb-2">{{ stat.value }}</p>
            <p class="text-gray-500 text-sm uppercase tracking-wider">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <div class="glass-card-static p-12 md:p-16 relative overflow-hidden">
          <!-- Background glow -->
          <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
               style="background: radial-gradient(circle, rgba(57,255,20,0.3) 0%, transparent 70%);"></div>

          <h2 class="font-heading font-black text-3xl sm:text-4xl text-white mb-4 relative z-10">
            Ready to <span class="text-gradient-gold">Compete?</span>
          </h2>
          <p class="text-gray-400 max-w-lg mx-auto mb-8 relative z-10">
            Create your account, join a tournament, and show your skills to the community. 
            Your road to glory starts here.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <NuxtLink to="/auth/signup" class="btn-neon !px-8 !py-4 !text-base">
              Get Started Free
            </NuxtLink>
            <NuxtLink to="/tournaments" class="btn-glass !px-8 !py-4 !text-base">
              Browse Tournaments
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { fetchTournaments } = useTournament()

const tournaments = ref<any[]>([])
const loading = ref(true)

const howItWorks = [
  {
    icon: '🏗️',
    title: 'Create',
    description: 'Set up your knockout tournament with custom rules, eligibility, and theme. Up to 8 players in a single-elimination bracket.',
  },
  {
    icon: '⚔️',
    title: 'Compete',
    description: 'Players join, the bracket is generated, and matches begin. The owner spectates and enters scores in real-time.',
  },
  {
    icon: '🏆',
    title: 'Conquer',
    description: 'Winners advance automatically. The final victor claims the trophy and community glory.',
  },
]

const stats = [
  { value: '🏟️', label: 'Tournaments' },
  { value: '⚽', label: 'Matches' },
  { value: '👥', label: 'Players' },
  { value: '🔴', label: 'Live Now' },
]

onMounted(async () => {
  try {
    tournaments.value = await fetchTournaments({ limit: 3 })
  } catch (error) {
    console.error('Failed to fetch tournaments:', error)
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'eFootball Arena — Community Tournament Platform',
})
</script>
