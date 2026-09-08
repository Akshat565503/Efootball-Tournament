<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto" v-if="tournament">
      <!-- Tournament Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <NuxtLink to="/tournaments" class="text-sm text-gray-500 hover:text-neon-green transition-colors mb-2 inline-block">
              ← Back to Tournaments
            </NuxtLink>
            <h1 class="font-heading font-bold text-3xl sm:text-4xl text-white mb-2">{{ tournament.name }}</h1>
            <div class="flex items-center gap-3 flex-wrap">
              <span :class="statusBadgeClass">{{ statusLabel }}</span>
              <span v-if="tournament.theme" class="badge-scheduled">{{ tournament.theme }}</span>
              <span class="text-sm text-gray-500">{{ tournament.ruleset }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button v-if="canJoin" @click="handleJoin" :disabled="joining"
                    class="btn-neon">
              {{ joining ? 'Joining...' : 'Join Tournament' }}
            </button>
            <button v-if="isOwnerOfThis && tournament.status === 'open'" 
                    @click="handleStart" :disabled="starting"
                    class="btn-neon">
              {{ starting ? 'Starting...' : 'Start Tournament' }}
            </button>
          </div>
        </div>

        <!-- Description -->
        <p v-if="tournament.description" class="text-gray-400 mb-6 max-w-3xl">{{ tournament.description }}</p>

        <!-- Meta bar -->
        <div class="flex items-center gap-6 flex-wrap text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-500">Hosted by</span>
            <NuxtLink v-if="tournament.owner" :to="`/profile/${tournament.owner.username}`"
                       class="text-neon-green hover:underline font-medium">
              {{ tournament.owner.display_name || tournament.owner.username }}
            </NuxtLink>
          </div>
          <div class="flex items-center gap-2 text-gray-500">
            <span>Players:</span>
            <span class="text-white font-semibold">{{ tournament.participant_count || 0 }}/{{ tournament.max_players }}</span>
          </div>
          <div v-if="tournament.start_date" class="text-gray-500">
            Starts: {{ new Date(tournament.start_date).toLocaleDateString() }}
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- Error messages banner -->
      <div v-if="error" class="p-4 mb-6 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <span class="text-accent-red text-base shrink-0">⚠️</span>
          <div>
            <p class="text-accent-red text-sm font-semibold mb-0.5">Notice</p>
            <p class="text-accent-red/90 text-xs leading-relaxed">{{ error }}</p>
          </div>
        </div>
        <button @click="error = ''" class="text-accent-red/60 hover:text-accent-red text-xs px-2 py-1">✕</button>
      </div>

      <!-- Success message banner -->
      <div v-if="successMsg" class="p-4 mb-6 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <span class="text-neon-green text-base shrink-0">✅</span>
          <div>
            <p class="text-neon-green text-sm font-semibold mb-0.5">Success</p>
            <p class="text-neon-green/90 text-xs leading-relaxed">{{ successMsg }}</p>
          </div>
        </div>
        <button @click="successMsg = ''" class="text-neon-green/60 hover:text-neon-green text-xs px-2 py-1">✕</button>
      </div>

      <!-- Missing eFootball ID warning banner for joined/joining users -->
      <div v-if="isAuthenticated && !userProfile?.efootball_id" class="p-4 mb-6 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-xl">🎁</span>
          <div>
            <p class="text-white text-xs font-semibold">Missing eFootball™ Account ID</p>
            <p class="text-gray-400 text-xs">Add your in-game username or player ID in your dashboard so the organizer can distribute prizes.</p>
          </div>
        </div>
        <NuxtLink to="/dashboard" class="btn-glass !py-1.5 !px-3 text-xs shrink-0 !text-accent-gold border-accent-gold/30">
          Set Account ID →
        </NuxtLink>
      </div>

      <!-- Live Match -->
      <div v-if="liveMatch" class="mb-8">
        <h2 class="font-heading font-bold text-xl text-white mb-4 flex items-center gap-2">
          <span class="live-indicator !text-xs">Live Match</span>
        </h2>
        <LiveMatchCard :match="liveMatch" />
      </div>

      <!-- Bracket -->
      <div class="mb-8">
        <h2 class="font-heading font-bold text-xl text-white mb-4">🏆 Bracket</h2>
        <div class="glass-card-static p-4">
          <TournamentBracket 
            :matches="tournament.matches || []" 
            :is-owner="isOwnerOfThis"
            @score-submitted="refreshTournament" />
        </div>
      </div>

      <!-- Participants -->
      <div>
        <h2 class="font-heading font-bold text-xl text-white mb-4">
          👥 Participants ({{ tournament.participant_count || 0 }}/{{ tournament.max_players }})
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="participant in tournament.participants" :key="participant.user_id"
               class="glass-card-static p-4 flex flex-col justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center text-pitch-950 font-bold flex-shrink-0">
                {{ participant.profile?.display_name?.[0] || participant.profile?.username?.[0] || '?' }}
              </div>
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/profile/${participant.profile?.username}`"
                           class="text-sm font-semibold text-white hover:text-neon-green transition-colors truncate block">
                  {{ participant.profile?.display_name || participant.profile?.username || 'Player' }}
                </NuxtLink>
                <p v-if="participant.profile?.favorite_club" class="text-xs text-gray-400 truncate">
                  ⚽ {{ participant.profile.favorite_club }}
                </p>
              </div>
            </div>

            <!-- In-game reward / Account ID badge -->
            <div v-if="participant.profile?.efootball_id" class="pt-2 border-t border-glass-border flex items-center justify-between text-xs">
              <span class="text-gray-400 truncate font-mono text-[11px]">🎮 {{ participant.profile.efootball_id }}</span>
              <button @click="copyToClipboard(participant.profile.efootball_id)" 
                      class="text-[10px] px-1.5 py-0.5 rounded bg-glass-medium hover:bg-neon-green/20 hover:text-neon-green text-gray-300 transition-colors"
                      title="Copy eFootball ID">
                Copy
              </button>
            </div>
          </div>

          <!-- Empty slots -->
          <div v-for="i in emptySlots" :key="'empty-' + i"
               class="glass-card-static p-4 flex items-center gap-3 opacity-40">
            <div class="w-10 h-10 rounded-full bg-glass-light flex items-center justify-center text-gray-600">
              ?
            </div>
            <span class="text-sm text-gray-600">Open Slot</span>
          </div>
        </div>
      </div>

      <!-- Owner Controls -->
      <div v-if="isOwnerOfThis && tournament.status === 'in_progress'" class="mt-8">
        <div class="section-divider"></div>
        <h2 class="font-heading font-bold text-xl text-white mb-4">⚙️ Owner Controls</h2>
        <div class="glass-card-static p-6">
          <p class="text-gray-400 text-sm mb-4">
            Click on any scheduled match in the bracket to enter scores. 
            Winners are advanced automatically.
          </p>
          <div class="flex flex-wrap gap-3">
            <button v-for="match in scheduledMatches" :key="match.id"
                    @click="handleSetLive(match)"
                    class="btn-glass !py-2 !text-xs"
                    :disabled="!match.player1_id || !match.player2_id">
              Set Match {{ match.match_order }} Live
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="max-w-6xl mx-auto pt-24">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-glass-light rounded w-1/2"></div>
        <div class="h-4 bg-glass-light rounded w-1/3"></div>
        <div class="h-64 bg-glass-light rounded-2xl"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { isAuthenticated, user, profile: userProfile } = useAuth()
const { fetchTournament, joinTournament, startTournament, updateMatchStatus } = useTournament()
const { joinTournamentRoom, onBracketUpdated, onMatchUpdated, onParticipantJoined, connect } = useSocket()

const tournament = ref<any>(null)
const loading = ref(true)
const joining = ref(false)
const starting = ref(false)
const error = ref('')
const successMsg = ref('')

const tournamentId = computed(() => route.params.id as string)

const isOwnerOfThis = computed<boolean>(() => {
  return !!(user.value && tournament.value?.owner_id === user.value.id)
})

const canJoin = computed(() => {
  if (!isAuthenticated.value || !tournament.value) return false
  if (tournament.value.status !== 'open') return false
  if (isOwnerOfThis.value) return false
  const alreadyJoined = tournament.value.participants?.some(
    (p: any) => p.user_id === user.value?.id
  )
  return !alreadyJoined
})

const emptySlots = computed(() => {
  if (!tournament.value) return 0
  const count = tournament.value.participant_count || tournament.value.participants?.length || 0
  return Math.max(0, tournament.value.max_players - count)
})

const liveMatch = computed(() => {
  return tournament.value?.matches?.find((m: any) => m.status === 'live')
})

const scheduledMatches = computed(() => {
  return tournament.value?.matches?.filter((m: any) => 
    m.status === 'scheduled' && m.player1_id && m.player2_id
  ) || []
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    draft: 'Draft', open: 'Open', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled',
  }
  return labels[tournament.value?.status] || tournament.value?.status
})

const statusBadgeClass = computed(() => {
  const classes: Record<string, string> = {
    open: 'badge-open', in_progress: 'badge-in-progress',
    completed: 'badge-completed', draft: 'badge-scheduled',
  }
  return classes[tournament.value?.status] || 'badge'
})

async function loadTournament() {
  loading.value = true
  error.value = ''
  try {
    tournament.value = await fetchTournament(tournamentId.value)
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'Failed to load tournament'
  } finally {
    loading.value = false
  }
}

async function refreshTournament() {
  try {
    tournament.value = await fetchTournament(tournamentId.value)
  } catch (e) {
    console.error('Failed to refresh:', e)
  }
}

async function handleJoin() {
  joining.value = true
  error.value = ''
  successMsg.value = ''
  try {
    await joinTournament(tournamentId.value)
    successMsg.value = 'You have registered for the tournament successfully!'
    await refreshTournament()
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'Failed to join tournament. Please try again.'
  } finally {
    joining.value = false
  }
}

async function handleStart() {
  starting.value = true
  error.value = ''
  successMsg.value = ''
  try {
    await startTournament(tournamentId.value)
    successMsg.value = 'Tournament bracket generated and tournament is now in progress!'
    await refreshTournament()
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'Failed to start tournament. Ensure at least 2 players are registered.'
  } finally {
    starting.value = false
  }
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

async function handleSetLive(match: any) {
  try {
    await updateMatchStatus(match.id, 'live')
    await refreshTournament()
  } catch (e: any) {
    error.value = e?.data?.error || 'Failed to update match status'
  }
}

onMounted(async () => {
  await loadTournament()

  // Join socket room for live updates
  connect()
  joinTournamentRoom(tournamentId.value)

  onBracketUpdated(() => refreshTournament())
  onMatchUpdated(() => refreshTournament())
  onParticipantJoined(() => refreshTournament())
})

useHead({ title: computed(() => tournament.value?.name ? `${tournament.value.name} — eFootball Arena` : 'Tournament — eFootball Arena') })
</script>
