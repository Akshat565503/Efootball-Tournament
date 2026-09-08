<template>
  <div>
    <NuxtLayout name="auth">
      <div class="glass-card-static p-8">
        <h2 class="font-heading font-bold text-2xl text-white text-center mb-2">Create your account</h2>
        <p class="text-gray-500 text-sm text-center mb-6">Join the eFootball™ community</p>

        <form @submit.prevent="handleSignup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Email Address *</label>
            <input v-model="email" type="email" required placeholder="you@example.com"
                   class="input-glass" autocomplete="email" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Password (Min 6 characters) *</label>
            <input v-model="password" type="password" required placeholder="••••••••"
                   minlength="6" class="input-glass" autocomplete="new-password" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password *</label>
            <input v-model="confirmPassword" type="password" required placeholder="••••••••"
                   class="input-glass" autocomplete="new-password" />
          </div>

          <!-- Error Alert Banner -->
          <div v-if="error" class="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-start gap-2.5">
            <span class="text-accent-red text-sm shrink-0">⚠️</span>
            <span class="text-accent-red text-xs leading-relaxed">{{ error }}</span>
          </div>

          <!-- Success Alert Banner -->
          <div v-if="success" class="p-3.5 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-start gap-2.5">
            <span class="text-neon-green text-sm shrink-0">✅</span>
            <span class="text-neon-green text-xs leading-relaxed font-medium">
              Account created successfully! If email confirmation is enabled, please check your inbox to confirm your email.
            </span>
          </div>

          <button type="submit" :disabled="loading" class="btn-neon w-full !py-3 font-semibold">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-4 my-6">
          <div class="flex-1 h-px bg-glass-border"></div>
          <span class="text-xs text-gray-500 uppercase tracking-wider">or continue with</span>
          <div class="flex-1 h-px bg-glass-border"></div>
        </div>

        <!-- Google OAuth -->
        <div>
          <button @click="handleOAuth('google')" type="button"
                  class="btn-glass w-full !py-3 text-sm font-medium flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span class="text-white">Sign up with Google</span>
          </button>
        </div>

        <p class="text-center text-gray-500 text-sm mt-6">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-neon-green hover:underline font-medium">Sign in</NuxtLink>
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signUp, signInWithProvider } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleSignup() {
  error.value = ''
  success.value = false

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
    error.value = 'Please enter a valid email address.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match. Please re-type your confirm password.'
    return
  }

  loading.value = true

  try {
    await signUp(trimmedEmail, password.value)
    success.value = true
  } catch (e: any) {
    const rawMsg = e?.message || ''
    if (rawMsg.includes('User already registered') || rawMsg.includes('already exists')) {
      error.value = 'An account with this email address already exists. Please sign in instead.'
    } else {
      error.value = rawMsg || 'Failed to create account. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

async function handleOAuth(provider: 'google') {
  error.value = ''
  try {
    await signInWithProvider(provider)
  } catch (e: any) {
    error.value = e?.message || `Failed to sign in with Google`
  }
}

useHead({ title: 'Sign Up — eFootball Arena' })
</script>
