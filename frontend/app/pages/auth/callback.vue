<template>
  <div class="min-h-screen flex items-center justify-center bg-pitch-950">
    <div class="text-center">
      <div class="w-12 h-12 rounded-full border-2 border-neon-green border-t-transparent animate-spin mx-auto mb-4"></div>
      <p class="text-gray-400 font-medium">Completing sign in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { initialize } = useAuth()

onMounted(async () => {
  try {
    await initialize()
    // Clean URL hash so Vue Router doesn't interpret #access_token as an element selector
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    await navigateTo('/dashboard', { replace: true })
  } catch (error) {
    console.error('Auth callback error:', error)
    await navigateTo('/auth/login', { replace: true })
  }
})
</script>
