<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-2xl mx-auto">
      <h1 class="font-heading font-bold text-3xl text-white mb-2">
        Create <span class="text-gradient-neon">Tournament</span>
      </h1>
      <p class="text-gray-400 mb-8 text-sm">Set up your eFootball™ knockout tournament bracket and invite contenders.</p>

      <form @submit.prevent="handleCreate" class="space-y-6">
        <!-- Tournament Name -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-medium text-gray-300">Tournament Name *</label>
            <span class="text-xs text-gray-500 font-mono">{{ form.name.length }}/60</span>
          </div>
          <input 
            v-model="form.name" 
            type="text" 
            required
            maxlength="60"
            placeholder="e.g. Champions League Knockout Stage"
            class="input-glass transition-all" 
            :class="{ '!border-accent-red/60': touched.name && !isNameValid }"
            @blur="touched.name = true"
          />
          <p v-if="touched.name && !isNameValid" class="text-accent-red text-xs mt-1.5 flex items-center gap-1">
            <span>⚠️</span> Tournament name must be between 3 and 60 characters.
          </p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
          <textarea 
            v-model="form.description" 
            rows="3"
            placeholder="Explain tournament rules, match schedule, or prize details..."
            class="input-glass resize-none"></textarea>
        </div>

        <!-- Theme -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Theme / Category (Optional)</label>
          <input 
            v-model="form.theme" 
            type="text"
            placeholder="e.g. Premier League Only, Under-24 Squads, National Teams"
            class="input-glass" />
        </div>

        <!-- Two columns with custom select dropdowns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Max Players Dropdown -->
          <div>
            <CustomSelect
              v-model="form.max_players"
              :options="playerOptions"
              label="Max Players *"
              placeholder="Select player count"
            />
            <span class="text-[11px] text-gray-500 mt-1 block">Knockout bracket dynamically adapts to 2, 4, 6, or 8 players.</span>
          </div>

          <!-- Ruleset Dropdown -->
          <div>
            <CustomSelect
              v-model="form.ruleset"
              :options="rulesetOptions"
              label="Ruleset *"
              placeholder="Select ruleset"
            />
            <span class="text-[11px] text-gray-500 mt-1 block">Specifies the eFootball in-game room match configuration.</span>
          </div>
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Scheduled Start Date & Time (Optional)</label>
          <input 
            v-model="form.start_date" 
            type="datetime-local" 
            class="input-glass" 
            :class="{ '!border-accent-gold/60': isDateInPast }"
          />
          <p v-if="isDateInPast" class="text-accent-gold text-xs mt-1.5 flex items-center gap-1">
            <span>ℹ️</span> Note: The selected start time is in the past. Players will still be able to join immediately.
          </p>
        </div>

        <!-- Eligibility -->
        <div class="p-4 rounded-xl bg-glass-light/50 border border-glass-border">
          <label class="block text-sm font-medium text-gray-300 mb-2">Team Eligibility Restrictions (Optional)</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="eligibility.league" type="text" placeholder="League (e.g. Premier League)"
                   class="input-glass text-sm" />
            <input v-model="eligibility.country" type="text" placeholder="Country (e.g. England)"
                   class="input-glass text-sm" />
            <input v-model="eligibility.club" type="text" placeholder="Club (e.g. Arsenal)"
                   class="input-glass text-sm" />
            <input v-model="eligibility.region" type="text" placeholder="Region (e.g. Europe)"
                   class="input-glass text-sm" />
          </div>
          <p class="text-xs text-gray-500 mt-2">Leave empty for open tournaments with no squad restrictions.</p>
        </div>

        <!-- Banner URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Banner Image URL (Optional)</label>
          <input 
            v-model="form.banner_url" 
            type="url"
            placeholder="https://images.unsplash.com/..."
            class="input-glass" 
            :class="{ '!border-accent-red/60': touched.banner && !isBannerValid }"
            @blur="touched.banner = true"
          />
          <p v-if="touched.banner && !isBannerValid" class="text-accent-red text-xs mt-1.5 flex items-center gap-1">
            <span>⚠️</span> Please enter a valid URL starting with http:// or https://
          </p>
        </div>

        <!-- Error Alert Banner -->
        <div v-if="error" class="p-3.5 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-start gap-2.5">
          <span class="text-accent-red text-sm shrink-0">⚠️</span>
          <span class="text-accent-red text-xs leading-relaxed font-medium">{{ error }}</span>
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-4 pt-4">
          <button 
            type="submit" 
            :disabled="creating || !isFormValid" 
            class="btn-neon flex-1 font-semibold !py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ creating ? 'Creating Tournament...' : 'Create Tournament' }}
          </button>
          <NuxtLink to="/tournaments" class="btn-glass !py-3 px-6 text-sm font-medium">Cancel</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { createTournament } = useTournament()

const playerOptions = [
  { label: '2 Players (Head-to-Head)', value: 2, icon: '👥' },
  { label: '4 Players (Semifinals & Final)', value: 4, icon: '🏆' },
  { label: '6 Players (Quarterfinals with Byes)', value: 6, icon: '⚔️' },
  { label: '8 Players (Full 8-Player Bracket)', value: 8, icon: '🔥' },
]

const rulesetOptions = [
  { label: 'Friend Match (Standard 1v1)', value: 'Friend Match', icon: '🎮' },
  { label: 'Online Match (Competitive)', value: 'Online Match', icon: '🌐' },
  { label: 'Custom Rules', value: 'Custom Rules', icon: '⚙️' },
]

const form = reactive({
  name: '',
  description: '',
  theme: '',
  max_players: 8,
  ruleset: 'Friend Match',
  start_date: '',
  banner_url: '',
})

const eligibility = reactive({
  league: '',
  country: '',
  club: '',
  region: '',
})

const touched = reactive({
  name: false,
  banner: false,
})

const creating = ref(false)
const error = ref('')

const isNameValid = computed(() => {
  const trimmed = form.name.trim()
  return trimmed.length >= 3 && trimmed.length <= 60
})

const isBannerValid = computed(() => {
  if (!form.banner_url || !form.banner_url.trim()) return true
  try {
    const url = new URL(form.banner_url.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
})

const isDateInPast = computed(() => {
  if (!form.start_date) return false
  const date = new Date(form.start_date)
  return !isNaN(date.getTime()) && date.getTime() < Date.now() - 60000
})

const isFormValid = computed(() => {
  return isNameValid.value && isBannerValid.value
})

async function handleCreate() {
  touched.name = true
  touched.banner = true

  if (!isNameValid.value) {
    error.value = 'Please provide a valid tournament name between 3 and 60 characters.'
    return
  }

  if (!isBannerValid.value) {
    error.value = 'Please provide a valid image URL for the banner.'
    return
  }

  creating.value = true
  error.value = ''

  try {
    const eligibilityFilter: Record<string, string> = {}
    if (eligibility.league.trim()) eligibilityFilter.league = eligibility.league.trim()
    if (eligibility.country.trim()) eligibilityFilter.country = eligibility.country.trim()
    if (eligibility.club.trim()) eligibilityFilter.club = eligibility.club.trim()
    if (eligibility.region.trim()) eligibilityFilter.region = eligibility.region.trim()

    const tournament = await createTournament({
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      theme: form.theme?.trim() || undefined,
      max_players: form.max_players,
      ruleset: form.ruleset,
      start_date: form.start_date || undefined,
      banner_url: form.banner_url?.trim() || undefined,
      eligibility_filter: Object.keys(eligibilityFilter).length ? eligibilityFilter : undefined,
    })

    navigateTo(`/tournaments/${tournament.id}`)
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'Failed to create tournament. Please check your inputs.'
  } finally {
    creating.value = false
  }
}

useHead({ title: 'Create Tournament — eFootball Arena' })
</script>

