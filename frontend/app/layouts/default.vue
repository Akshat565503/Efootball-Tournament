<template>
  <div class="min-h-screen bg-pitch-950 font-body">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
         :class="scrolled ? 'bg-pitch-950/90 backdrop-blur-xl border-glass-border' : 'bg-transparent border-transparent'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-18">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-lg bg-gradient-neon flex items-center justify-center
                        group-hover:shadow-neon-green transition-shadow duration-300">
              <span class="text-pitch-950 font-heading font-black text-lg">⚽</span>
            </div>
            <span class="font-heading font-bold text-lg text-white hidden sm:block">
              eFootball<span class="text-gradient-neon">Arena</span>
            </span>
          </NuxtLink>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                       class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 
                              hover:text-white hover:bg-glass-light transition-all duration-200">
              {{ link.label }}
            </NuxtLink>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-3">
            <!-- Notification Bell -->
            <NotificationBell v-if="isAuthenticated" />

            <!-- Auth Buttons -->
            <template v-if="!isAuthenticated">
              <NuxtLink to="/auth/login" class="btn-glass !py-2 !px-4 !text-xs">Log In</NuxtLink>
              <NuxtLink to="/auth/signup" class="btn-neon !py-2 !px-4 !text-xs">Sign Up</NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/dashboard" class="btn-glass !py-2 !px-4 !text-xs">Dashboard</NuxtLink>
              <button @click="handleSignOut" class="btn-glass !py-2 !px-4 !text-xs text-gray-400">
                Sign Out
              </button>
            </template>

            <!-- Mobile menu toggle -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" 
                    class="md:hidden p-2 rounded-lg hover:bg-glass-light transition-colors">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-glass-border bg-pitch-950/95 backdrop-blur-xl">
          <div class="px-4 py-3 space-y-1">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                       @click="mobileMenuOpen = false"
                       class="block px-4 py-3 rounded-lg text-sm font-medium text-gray-400 
                              hover:text-white hover:bg-glass-light transition-all">
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-glass-border mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-lg bg-gradient-neon flex items-center justify-center">
                <span class="text-pitch-950 font-heading font-black text-lg">⚽</span>
              </div>
              <span class="font-heading font-bold text-lg text-white">
                eFootball<span class="text-gradient-neon">Arena</span>
              </span>
            </div>
            <p class="text-gray-500 text-sm max-w-md">
              The ultimate platform for hosting and competing in eFootball™ knockout tournaments. 
              Built for the community, by the community.
            </p>
          </div>
          <div>
            <h4 class="font-heading font-semibold text-white mb-3 text-sm">Platform</h4>
            <div class="space-y-2">
              <NuxtLink to="/tournaments" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Browse Tournaments</NuxtLink>
              <NuxtLink to="/tournaments/create" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Create Tournament</NuxtLink>
              <NuxtLink to="/dashboard" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Dashboard</NuxtLink>
            </div>
          </div>
          <div>
            <h4 class="font-heading font-semibold text-white mb-3 text-sm">Legal & Security</h4>
            <div class="space-y-2">
              <NuxtLink to="/privacy" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Privacy Policy</NuxtLink>
              <NuxtLink to="/terms" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Terms of Service</NuxtLink>
              <a href="/.well-known/security.txt" class="block text-sm text-gray-500 hover:text-neon-green transition-colors">Security Disclosure</a>
            </div>
          </div>
        </div>
        <div class="section-divider"></div>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {{ new Date().getFullYear() }} eFootball Arena. Not affiliated with Konami.</p>
          <div class="flex items-center gap-4">
            <NuxtLink to="/privacy" class="hover:underline">Privacy</NuxtLink>
            <NuxtLink to="/terms" class="hover:underline">Terms</NuxtLink>
            <a href="/.well-known/security.txt" class="hover:underline">Security</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, signOut, initialize } = useAuth()
const { connect } = useSocket()

const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/tournaments/create', label: 'Create' },
]

onMounted(async () => {
  await initialize()

  if (isAuthenticated.value) {
    connect()
  }

  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
})

async function handleSignOut() {
  await signOut()
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
