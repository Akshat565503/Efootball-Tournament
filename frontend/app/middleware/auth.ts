export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, loading } = useAuth()

  // Don't redirect while loading
  if (loading.value) return

  if (!isAuthenticated.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
