<template>
  <div class="bracket-container w-full overflow-x-auto pb-4">
    <div class="flex items-stretch gap-8 min-w-max px-4 py-6" v-if="rounds.length > 0">
      <!-- Each Round Column -->
      <div v-for="(round, roundIndex) in rounds" :key="roundIndex" class="flex flex-col justify-around flex-shrink-0"
           :style="{ minWidth: '240px' }">
        <!-- Round Header -->
        <h3 class="font-heading font-bold text-center text-sm uppercase tracking-wider mb-6"
            :class="roundIndex === rounds.length - 1 ? 'text-accent-gold' : 'text-gray-400'">
          {{ getRoundName(roundIndex + 1) }}
        </h3>

        <!-- Matches in this round -->
        <div class="flex flex-col justify-around flex-1 gap-4">
          <div v-for="match in round" :key="match.id"
               class="glass-card-static p-3 relative"
               :class="{
                 'border-accent-red/50 shadow-lg shadow-accent-red/10': match.status === 'live',
                 'border-neon-green/30': match.status === 'completed',
                 'cursor-pointer hover:border-neon-blue/50': isOwner,
               }"
               @click="handleMatchClick(match)">
            
            <!-- LIVE indicator -->
            <div v-if="match.status === 'live'" class="absolute -top-2 left-1/2 -translate-x-1/2">
              <span class="live-indicator !py-0.5 !px-2 !text-[10px]">LIVE</span>
            </div>

            <!-- Player 1 -->
            <div class="flex items-center justify-between py-1.5 px-2 rounded-lg mb-1"
                 :class="{ 'bg-neon-green/10': match.winner_id === match.player1_id }">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                     :class="match.player1_id ? 'bg-gradient-neon text-pitch-950' : 'bg-glass-light text-gray-600'">
                  {{ getPlayerInitial(match, 'player1') }}
                </div>
                <span class="text-sm font-medium truncate" 
                      :class="match.player1_id ? 'text-white' : 'text-gray-600'">
                  {{ getPlayerName(match, 'player1') }}
                </span>
              </div>
              <span class="text-sm font-heading font-bold ml-2"
                    :class="match.status !== 'scheduled' ? 
                      (match.winner_id === match.player1_id ? 'text-neon-green' : 'text-gray-500') : 'text-gray-600'">
                {{ match.status !== 'scheduled' ? match.score1 : '-' }}
              </span>
            </div>

            <!-- Divider -->
            <div class="h-px bg-glass-border mx-2"></div>

            <!-- Player 2 -->
            <div class="flex items-center justify-between py-1.5 px-2 rounded-lg mt-1"
                 :class="{ 'bg-neon-green/10': match.winner_id === match.player2_id }">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                     :class="match.player2_id ? 'bg-neon-blue/80 text-pitch-950' : 'bg-glass-light text-gray-600'">
                  {{ getPlayerInitial(match, 'player2') }}
                </div>
                <span class="text-sm font-medium truncate"
                      :class="match.player2_id ? 'text-white' : 'text-gray-600'">
                  {{ getPlayerName(match, 'player2') }}
                </span>
              </div>
              <span class="text-sm font-heading font-bold ml-2"
                    :class="match.status !== 'scheduled' ? 
                      (match.winner_id === match.player2_id ? 'text-neon-green' : 'text-gray-500') : 'text-gray-600'">
                {{ match.status !== 'scheduled' ? match.score2 : '-' }}
              </span>
            </div>

            <!-- Bye indicator -->
            <div v-if="match.is_bye" class="text-center mt-1">
              <span class="text-[10px] text-gray-600 uppercase tracking-wider">Bye</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Winner Column -->
      <div v-if="champion" class="flex flex-col justify-center items-center flex-shrink-0 min-w-[220px]">
        <h3 class="font-heading font-bold text-accent-gold text-sm uppercase tracking-wider mb-4">🏆 Champion</h3>
        <div class="glass-card-static p-6 text-center border-accent-gold/40 shadow-neon-gold relative">
          <div class="w-16 h-16 rounded-full bg-gradient-gold mx-auto flex items-center justify-center text-pitch-950 
                      font-heading font-black text-2xl mb-3 shadow-neon-gold">
            {{ champion.display_name?.[0] || champion.username?.[0] || '?' }}
          </div>
          <p class="font-heading font-bold text-white text-base">
            {{ champion.display_name || champion.username }}
          </p>
          <p v-if="champion.favorite_club" class="text-xs text-gray-400 mt-0.5">⚽ {{ champion.favorite_club }}</p>

          <!-- Winner Reward ID Badge -->
          <div v-if="champion.efootball_id" class="mt-4 pt-3 border-t border-glass-border">
            <span class="text-[10px] text-accent-gold font-semibold uppercase tracking-wider block mb-1">🎁 Reward Account ID</span>
            <div class="flex items-center justify-center gap-2 bg-pitch-950/80 px-2.5 py-1.5 rounded-lg border border-accent-gold/30">
              <span class="text-xs font-mono font-bold text-white truncate">{{ champion.efootball_id }}</span>
              <button @click="copyText(champion.efootball_id)" 
                      class="text-[10px] px-2 py-0.5 rounded bg-accent-gold/20 text-accent-gold hover:bg-accent-gold hover:text-pitch-950 font-semibold transition-all">
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12 text-gray-500">
      <p class="text-lg font-heading font-semibold mb-2">Bracket not generated yet</p>
      <p class="text-sm">The bracket will appear once the tournament starts.</p>
    </div>

    <!-- Score Entry Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showScoreModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             @click.self="showScoreModal = false">
          <div class="absolute inset-0 bg-pitch-950/80 backdrop-blur-sm"></div>
          <div class="glass-card-static p-6 w-full max-w-sm relative z-10">
            <h3 class="font-heading font-bold text-white text-lg mb-1">Enter Match Score</h3>
            <p class="text-gray-400 text-xs mb-4">Enter final full-time scores to advance the winner.</p>

            <div class="space-y-3 mb-4">
              <div class="flex items-center justify-between gap-4 p-3 rounded-xl bg-glass-light border border-glass-border">
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-semibold text-white block truncate">
                    {{ getPlayerName(selectedMatch, 'player1') }}
                  </span>
                  <span v-if="selectedMatch?.player1?.efootball_id" class="text-[11px] text-neon-green/90 font-mono block truncate">
                    🎮 {{ selectedMatch.player1.efootball_id }}
                  </span>
                </div>
                <input v-model.number="scoreForm.score1" type="number" min="0" step="1"
                       class="input-glass w-16 text-center !py-2 font-bold text-base" />
              </div>

              <div class="flex items-center justify-between gap-4 p-3 rounded-xl bg-glass-light border border-glass-border">
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-semibold text-white block truncate">
                    {{ getPlayerName(selectedMatch, 'player2') }}
                  </span>
                  <span v-if="selectedMatch?.player2?.efootball_id" class="text-[11px] text-neon-green/90 font-mono block truncate">
                    🎮 {{ selectedMatch.player2.efootball_id }}
                  </span>
                </div>
                <input v-model.number="scoreForm.score2" type="number" min="0" step="1"
                       class="input-glass w-16 text-center !py-2 font-bold text-base" />
              </div>
            </div>

            <!-- Inline validation warning for draw -->
            <div v-if="isScoreEqual" class="p-2.5 mb-4 rounded-lg bg-accent-gold/10 border border-accent-gold/30 flex items-start gap-2 text-xs text-accent-gold">
              <span>⚠️</span>
              <span>Draws are not permitted in knockout brackets. Enter the final score including extra time or penalty shootout.</span>
            </div>

            <!-- Negative score warning -->
            <div v-if="hasNegativeScore" class="p-2.5 mb-4 rounded-lg bg-accent-red/10 border border-accent-red/30 flex items-start gap-2 text-xs text-accent-red">
              <span>⚠️</span>
              <span>Scores cannot be negative.</span>
            </div>

            <div v-if="scoreError" class="p-2.5 mb-4 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">{{ scoreError }}</div>

            <div class="flex gap-3">
              <button @click="showScoreModal = false" class="btn-glass flex-1 !py-2.5 text-sm">Cancel</button>
              <button @click="handleSubmitScore" class="btn-neon flex-1 !py-2.5 text-sm font-semibold" :disabled="submitting || isScoreEqual || hasNegativeScore">
                {{ submitting ? 'Saving...' : 'Submit Score' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  matches: any[]
  isOwner: boolean
}>()

const emit = defineEmits<{
  (e: 'score-submitted'): void
}>()

const { submitScore } = useTournament()

const showScoreModal = ref(false)
const selectedMatch = ref<any>(null)
const scoreForm = reactive({ score1: 0, score2: 0 })
const scoreError = ref('')
const submitting = ref(false)

const isScoreEqual = computed(() => {
  return typeof scoreForm.score1 === 'number' && 
         typeof scoreForm.score2 === 'number' && 
         scoreForm.score1 === scoreForm.score2
})

const hasNegativeScore = computed(() => {
  return (scoreForm.score1 < 0) || (scoreForm.score2 < 0)
})

// Group matches by round
const rounds = computed(() => {
  if (!props.matches?.length) return []

  const roundMap = new Map<number, any[]>()
  for (const match of props.matches) {
    if (!roundMap.has(match.round)) {
      roundMap.set(match.round, [])
    }
    roundMap.get(match.round)!.push(match)
  }

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, matches]) => matches.sort((a: any, b: any) => a.match_order - b.match_order))
})

const totalRounds = computed(() => rounds.value.length)

const champion = computed(() => {
  if (!rounds.value.length) return null
  const finalRound = rounds.value[rounds.value.length - 1]
  const finalMatch = finalRound?.[0]
  if (finalMatch?.status === 'completed' && finalMatch.winner_id) {
    // Get winner profile from match data
    if (finalMatch.winner_id === finalMatch.player1_id) {
      return finalMatch.player1 || { username: 'Winner' }
    }
    return finalMatch.player2 || { username: 'Winner' }
  }
  return null
})

function getRoundName(round: number): string {
  const diff = totalRounds.value - round
  if (diff === 0) return '🏆 Final'
  if (diff === 1) return 'Semi-Finals'
  if (diff === 2) return 'Quarter-Finals'
  return `Round ${round}`
}

function getPlayerName(match: any, slot: 'player1' | 'player2'): string {
  if (!match) return 'TBD'
  const player = match[slot]
  if (player && typeof player === 'object') {
    return player.display_name || player.username || 'Unknown'
  }
  const id = slot === 'player1' ? match.player1_id : match.player2_id
  return id ? 'Player' : 'TBD'
}

function getPlayerInitial(match: any, slot: 'player1' | 'player2'): string {
  const name = getPlayerName(match, slot)
  return name === 'TBD' ? '?' : name[0].toUpperCase()
}

function handleMatchClick(match: any) {
  if (!props.isOwner) return
  if (match.status === 'completed') return
  if (!match.player1_id || !match.player2_id) return

  selectedMatch.value = match
  scoreForm.score1 = match.score1 || 0
  scoreForm.score2 = match.score2 || 0
  scoreError.value = ''
  showScoreModal.value = true
}

async function handleSubmitScore() {
  if (scoreForm.score1 === scoreForm.score2) {
    scoreError.value = 'Draws are not allowed. Include extra time / penalties.'
    return
  }

  submitting.value = true
  scoreError.value = ''

  try {
    await submitScore(selectedMatch.value.id, scoreForm.score1, scoreForm.score2)
    showScoreModal.value = false
    emit('score-submitted')
  } catch (error: any) {
    scoreError.value = error?.data?.error || error?.message || 'Failed to submit score'
  } finally {
    submitting.value = false
  }
}

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}
</script>

<style scoped>
.bracket-container::-webkit-scrollbar {
  height: 6px;
}
.bracket-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}
.bracket-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
