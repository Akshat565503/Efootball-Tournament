<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="font-heading font-bold text-3xl text-white mb-1">
            {{ greeting }}, <span class="text-gradient-neon">{{ displayName }}</span>
          </h1>
          <div class="flex items-center gap-3 text-sm text-gray-400 mt-1">
            <span v-if="profile?.efootball_id" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-xs font-mono">
              🎮 ID: {{ profile.efootball_id }}
            </span>
            <span>{{ isOwner ? 'Tournament Organizer' : 'Player' }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showEditProfile = true" class="btn-glass !py-2.5 text-sm flex items-center gap-2">
            ✏️ {{ hasProfile ? 'Edit Profile' : 'Set Up Profile' }}
          </button>
          <NuxtLink v-if="isOwner" to="/tournaments/create" class="btn-neon !py-2.5">
            + New Tournament
          </NuxtLink>
        </div>
      </div>

      <!-- Profile setup prompt (if profile is missing or missing eFootball ID) -->
      <div v-if="!hasProfile || !profile?.efootball_id" class="glass-card-static p-6 mb-8 border-accent-gold/40 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🎁</span>
            <h3 class="font-heading font-bold text-white text-lg">
              {{ hasProfile ? 'Add Your eFootball™ Account ID' : 'Complete Your Player Profile' }}
            </h3>
          </div>
          <p class="text-gray-400 text-sm mb-4">
            Enter your unique <strong>eFootball™ Account ID / In-Game Name</strong>. This is used by tournament organizers to verify match results and send rewards/prizes directly to the winner!
          </p>
          <form @submit.prevent="handleSaveProfile" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input v-if="!hasProfile" v-model="profileForm.username" type="text" required placeholder="Display Username *"
                       class="input-glass !py-2.5 text-sm"
                       :class="{ '!border-accent-red/60': touchedProfile.username && !isUsernameValid }"
                       @blur="touchedProfile.username = true" />
                <p v-if="!hasProfile && touchedProfile.username && !isUsernameValid" class="text-accent-red text-[11px] mt-1">
                  3-24 characters (letters, numbers, _ only)
                </p>
              </div>

              <div>
                <input v-model="profileForm.efootball_id" type="text" required placeholder="eFootball™ Account ID / IGN *"
                       class="input-glass !py-2.5 text-sm border-neon-green/40 focus:border-neon-green"
                       :class="{ '!border-accent-red/60': touchedProfile.efootball_id && !isEfootballIdValid }"
                       @blur="touchedProfile.efootball_id = true" />
                <p v-if="touchedProfile.efootball_id && !isEfootballIdValid" class="text-accent-red text-[11px] mt-1">
                  eFootball ID must be 2 to 40 characters
                </p>
              </div>

              <div>
                <input v-model="profileForm.favorite_club" type="text" placeholder="Favorite Club (e.g. Real Madrid)"
                       class="input-glass !py-2.5 text-sm" />
              </div>
            </div>

            <button type="submit" class="btn-neon !py-2.5 text-sm w-full font-semibold" :disabled="savingProfile || !isProfileFormValid">
              {{ savingProfile ? 'Saving Profile...' : 'Save Profile & Reward ID' }}
            </button>
          </form>

          <div v-if="profileError" class="p-3 mt-3 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-start gap-2">
            <span class="text-accent-red text-xs">⚠️</span>
            <p class="text-accent-red text-xs">{{ profileError }}</p>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showEditProfile" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showEditProfile = false">
            <div class="absolute inset-0 bg-pitch-950/80 backdrop-blur-sm"></div>
            <div class="glass-card-static p-6 w-full max-w-md relative z-10">
              <h3 class="font-heading font-bold text-white text-xl mb-1">Player Profile Settings</h3>
              <p class="text-gray-400 text-xs mb-5">Keep your in-game details accurate for tournament reward distribution.</p>

              <form @submit.prevent="handleSaveProfile" class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Username *</label>
                    <span class="text-[10px] text-gray-500 font-mono">{{ profileForm.username.length }}/24</span>
                  </div>
                  <input 
                    v-model="profileForm.username" 
                    type="text" 
                    required 
                    class="input-glass text-sm" 
                    :class="{ '!border-accent-red/60': touchedProfile.username && !isUsernameValid }"
                    placeholder="Your username"
                    @blur="touchedProfile.username = true" 
                  />
                  <p v-if="touchedProfile.username && !isUsernameValid" class="text-accent-red text-[11px] mt-1">
                    Username must be 3-24 characters (letters, numbers, and underscores only).
                  </p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-neon-green uppercase tracking-wider mb-1.5">
                    🎮 eFootball™ Account ID / In-Game Name *
                  </label>
                  <input 
                    v-model="profileForm.efootball_id" 
                    type="text" 
                    required 
                    class="input-glass text-sm border-neon-green/50"
                    :class="{ '!border-accent-red/60': touchedProfile.efootball_id && !isEfootballIdValid }"
                    placeholder="e.g. EF-1092834 or MasterStriker"
                    @blur="touchedProfile.efootball_id = true"
                  />
                  <p v-if="touchedProfile.efootball_id && !isEfootballIdValid" class="text-accent-red text-[11px] mt-1">
                    eFootball Account ID must be between 2 and 40 characters.
                  </p>
                  <span class="text-[11px] text-gray-500 mt-1 block">Your unique in-game username or player ID for prize distribution.</span>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Favorite Club</label>
                  <input v-model="profileForm.favorite_club" type="text" class="input-glass text-sm" placeholder="e.g. Manchester City" maxlength="50" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Region</label>
                  <input v-model="profileForm.region" type="text" class="input-glass text-sm" placeholder="e.g. Europe / Asia" maxlength="50" />
                </div>

                <div v-if="profileError" class="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-start gap-2">
                  <span class="text-accent-red text-xs">⚠️</span>
                  <p class="text-accent-red text-xs">{{ profileError }}</p>
                </div>

                <div class="flex gap-3 pt-2">
                  <button type="button" @click="showEditProfile = false" class="btn-glass flex-1 !py-2.5">Cancel</button>
                  <button type="submit" class="btn-neon flex-1 !py-2.5 font-semibold" :disabled="savingProfile || !isProfileFormValid">
                    {{ savingProfile ? 'Saving...' : 'Save Profile' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card-static p-4 text-center">
          <p class="text-2xl font-heading font-black text-gradient-neon">{{ myTournaments.length }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">
            {{ isOwner ? 'Created' : 'Joined' }}
          </p>
        </div>
        <div class="glass-card-static p-4 text-center">
          <p class="text-2xl font-heading font-black text-neon-blue">{{ activeTournaments.length }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Active</p>
        </div>
        <div class="glass-card-static p-4 text-center">
          <p class="text-2xl font-heading font-black text-accent-gold">{{ completedTournaments.length }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Completed</p>
        </div>
        <div class="glass-card-static p-4 text-center">
          <p class="text-2xl font-heading font-black text-accent-red">{{ unreadCount }}</p>
          <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Notifications</p>
        </div>
      </div>

      <!-- Active Tournaments -->
      <div v-if="activeTournaments.length > 0" class="mb-10">
        <h2 class="font-heading font-bold text-xl text-white mb-4">🔴 Active Tournaments</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TournamentCard v-for="t in activeTournaments" :key="t.id" :tournament="t" />
        </div>
      </div>

      <!-- Joined / Created Tournaments -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-heading font-bold text-xl text-white">
            {{ isOwner ? '🏆 My Tournaments' : '⚽ Joined Tournaments' }}
          </h2>
          <NuxtLink to="/tournaments" class="text-xs text-neon-green hover:underline">
            Browse All →
          </NuxtLink>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="glass-card-static p-5 animate-pulse">
            <div class="h-36 rounded-xl bg-glass-light mb-4"></div>
            <div class="h-5 bg-glass-light rounded w-3/4 mb-3"></div>
            <div class="h-4 bg-glass-light rounded w-1/2"></div>
          </div>
        </div>

        <div v-else-if="myTournaments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TournamentCard v-for="t in myTournaments" :key="t.id" :tournament="t" />
        </div>

        <div v-else class="glass-card-static p-8 text-center">
          <p class="text-4xl mb-3">🏟️</p>
          <p class="text-gray-400 font-heading font-semibold mb-1">No tournaments yet</p>
          <p class="text-gray-600 text-sm mb-4">
            {{ isOwner ? 'Create your first knockout tournament' : 'Browse open tournaments and join the competition' }}
          </p>
          <NuxtLink :to="isOwner ? '/tournaments/create' : '/tournaments'" class="btn-neon !py-2 !text-sm">
            {{ isOwner ? 'Create Tournament' : 'Browse Tournaments' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, profile, isOwner, hasProfile, createProfile, updateProfile, fetchProfile } = useAuth()
const { fetchTournaments } = useTournament()
const { unreadCount, fetchNotifications } = useNotifications()

const myTournaments = ref<any[]>([])
const loading = ref(true)
const savingProfile = ref(false)
const profileError = ref('')
const showEditProfile = ref(false)

const profileForm = reactive({
  username: '',
  efootball_id: '',
  favorite_club: '',
  region: '',
})

const touchedProfile = reactive({
  username: false,
  efootball_id: false,
})

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/

const isUsernameValid = computed(() => {
  const trimmed = profileForm.username.trim()
  return USERNAME_REGEX.test(trimmed)
})

const isEfootballIdValid = computed(() => {
  const trimmed = profileForm.efootball_id.trim()
  return trimmed.length >= 2 && trimmed.length <= 40
})

const isProfileFormValid = computed(() => {
  return isUsernameValid.value && isEfootballIdValid.value
})

// Populate form when profile exists
watchEffect(() => {
  if (profile.value) {
    profileForm.username = profile.value.username || ''
    profileForm.efootball_id = profile.value.efootball_id || ''
    profileForm.favorite_club = profile.value.favorite_club || ''
    profileForm.region = profile.value.region || ''
  } else if (user.value) {
    const emailPrefix = user.value.email ? user.value.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : 'player'
    profileForm.username = emailPrefix.length >= 3 ? emailPrefix.slice(0, 20) : `player_${Math.floor(100 + Math.random() * 900)}`
  }
})

const displayName = computed(() => {
  return profile.value?.display_name || profile.value?.username || user.value?.email?.split('@')[0] || 'Player'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const activeTournaments = computed(() => 
  myTournaments.value.filter(t => t.status === 'in_progress' || t.status === 'open')
)

const completedTournaments = computed(() => 
  myTournaments.value.filter(t => t.status === 'completed')
)

async function handleSaveProfile() {
  savingProfile.value = true
  profileError.value = ''
  try {
    if (!hasProfile.value) {
      await createProfile({
        username: profileForm.username,
        efootball_id: profileForm.efootball_id,
        favorite_club: profileForm.favorite_club || undefined,
        region: profileForm.region || undefined,
      })
    } else {
      await updateProfile({
        username: profileForm.username,
        efootball_id: profileForm.efootball_id,
        favorite_club: profileForm.favorite_club || undefined,
        region: profileForm.region || undefined,
      })
    }
    await fetchProfile()
    showEditProfile.value = false
    myTournaments.value = await fetchTournaments({ limit: 20 })
    await fetchNotifications()
  } catch (e: any) {
    profileError.value = e?.data?.error || e?.message || 'Failed to save profile'
  } finally {
    savingProfile.value = false
  }
}

onMounted(async () => {
  try {
    myTournaments.value = await fetchTournaments({ limit: 20 })
    await fetchNotifications()
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
})

useHead({ title: 'Dashboard — eFootball Arena' })
</script>
