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
        <div class="glass-card-static p-5 border-glass-border">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-semibold text-white">Team Eligibility Restrictions (Optional)</label>
            <span class="text-[11px] px-2 py-0.5 rounded bg-glass-medium text-gray-400">Squad Rules</span>
          </div>
          <p class="text-xs text-gray-400 mb-4">Set specific squad criteria, or leave empty for an open tournament with no restrictions.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">🏆 League</label>
              <input v-model="eligibility.league" type="text" placeholder="e.g. Premier League, Serie A"
                     class="input-glass !py-2.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">🌍 Country</label>
              <input v-model="eligibility.country" type="text" placeholder="e.g. England, Spain, Brazil"
                     class="input-glass !py-2.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">🛡️ Club</label>
              <input v-model="eligibility.club" type="text" placeholder="e.g. Arsenal, Real Madrid"
                     class="input-glass !py-2.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">🌐 Region</label>
              <input v-model="eligibility.region" type="text" placeholder="e.g. Europe, South America"
                     class="input-glass !py-2.5 text-sm" />
            </div>
          </div>
        </div>

        <!-- Banner Image (Upload or URL) -->
        <div class="glass-card-static p-5 border-glass-border">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-semibold text-white">Tournament Banner Image (Optional)</label>
            <!-- Mode Switcher -->
            <div class="flex items-center gap-1 bg-glass-medium p-1 rounded-xl border border-glass-border">
              <button 
                type="button" 
                @click="bannerMode = 'upload'"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                :class="bannerMode === 'upload' ? 'bg-gradient-neon text-pitch-950 font-semibold shadow-neon-green' : 'text-gray-400 hover:text-white'">
                📁 Upload File
              </button>
              <button 
                type="button" 
                @click="bannerMode = 'url'"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                :class="bannerMode === 'url' ? 'bg-gradient-neon text-pitch-950 font-semibold shadow-neon-green' : 'text-gray-400 hover:text-white'">
                🔗 Image URL
              </button>
            </div>
          </div>

          <!-- Mode 1: File Upload -->
          <div v-if="bannerMode === 'upload'">
            <div v-if="!form.banner_url"
                 @click="triggerFileInput"
                 @dragover.prevent="isDragging = true"
                 @dragleave.prevent="isDragging = false"
                 @drop.prevent="handleFileDrop"
                 class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                 :class="isDragging ? 'border-neon-green bg-neon-green/5' : 'border-glass-border hover:border-gray-500 hover:bg-glass-light/30'">
              <input ref="fileInputRef" type="file" accept="image/png, image/jpeg, image/webp, image/gif" class="hidden" @change="handleFileSelect" />
              <div class="w-12 h-12 rounded-full bg-glass-light mx-auto flex items-center justify-center text-2xl mb-2 text-neon-green">
                📷
              </div>
              <p class="text-sm font-medium text-white mb-1">Click to upload or drag & drop</p>
              <p class="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
            </div>

            <!-- Preview if uploaded -->
            <div v-else class="relative rounded-xl overflow-hidden border border-glass-border group">
              <img :src="form.banner_url" alt="Banner Preview" class="w-full h-44 object-cover" />
              <div class="absolute inset-0 bg-pitch-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" @click="triggerFileInput" class="btn-glass !py-1.5 !px-3 text-xs">Change Image</button>
                <button type="button" @click="clearBanner" class="btn-danger !py-1.5 !px-3 text-xs">Remove</button>
              </div>
              <input ref="fileInputRef" type="file" accept="image/png, image/jpeg, image/webp, image/gif" class="hidden" @change="handleFileSelect" />
            </div>
            <p v-if="uploadError" class="text-accent-red text-xs mt-2">{{ uploadError }}</p>
          </div>

          <!-- Mode 2: URL Input -->
          <div v-else class="space-y-3">
            <input 
              v-model="form.banner_url" 
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              class="input-glass !py-2.5 text-sm" 
              :class="{ '!border-accent-red/60': touched.banner && !isBannerValid }"
              @blur="touched.banner = true"
            />
            <p v-if="touched.banner && !isBannerValid" class="text-accent-red text-xs flex items-center gap-1">
              <span>⚠️</span> Please enter a valid URL starting with http:// or https://
            </p>

            <!-- URL Preview -->
            <div v-if="form.banner_url && isBannerValid" class="relative rounded-xl overflow-hidden border border-glass-border">
              <img :src="form.banner_url" alt="Banner Preview" class="w-full h-36 object-cover" @error="uploadError = 'Could not load image from this URL'" />
            </div>
          </div>
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

const bannerMode = ref<'upload' | 'url'>('upload')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadError = ref('')
const creating = ref(false)
const error = ref('')

const isNameValid = computed(() => {
  const trimmed = form.name.trim()
  return trimmed.length >= 3 && trimmed.length <= 60
})

const isBannerValid = computed(() => {
  if (!form.banner_url || !form.banner_url.trim()) return true
  const val = form.banner_url.trim()
  if (val.startsWith('data:image/')) return true
  try {
    const url = new URL(val)
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

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

function processImageFile(file: File) {
  uploadError.value = ''
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select a valid image file (PNG, JPG, WEBP).'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Image size must be less than 5MB.'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    form.banner_url = e.target?.result as string
  }
  reader.onerror = () => {
    uploadError.value = 'Failed to read image file.'
  }
  reader.readAsDataURL(file)
}

function clearBanner() {
  form.banner_url = ''
  uploadError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleCreate() {
  touched.name = true
  touched.banner = true

  if (!isNameValid.value) {
    error.value = 'Please provide a valid tournament name between 3 and 60 characters.'
    return
  }

  if (!isBannerValid.value) {
    error.value = 'Please provide a valid image URL or uploaded file for the banner.'
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

