import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // Only scroll to hash if it's a valid DOM element ID (not an OAuth token hash)
    if (to.hash && !to.hash.includes('access_token') && !to.hash.includes('error=')) {
      try {
        const el = document.querySelector(to.hash)
        if (el) {
          return { el: to.hash, behavior: 'smooth' }
        }
      } catch {
        // Ignore invalid selectors
      }
    }
    return { top: 0 }
  },
}
