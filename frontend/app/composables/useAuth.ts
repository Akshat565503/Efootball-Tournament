import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js'

const supabaseClient = ref<any>(null)
const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const profile = ref<any>(null)
const loading = ref(true)
const initialized = ref(false)

export function useAuth() {
  const config = useRuntimeConfig()

  function getSupabase(): SupabaseClient {
    if (!supabaseClient.value) {
      supabaseClient.value = createClient(
        config.public.supabaseUrl as string,
        config.public.supabaseAnonKey as string
      )
    }
    return supabaseClient.value
  }

  async function initialize() {
    if (initialized.value) return
    initialized.value = true

    const sb = getSupabase()

    // Get initial session
    const { data: { session: currentSession } } = await sb.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null

    if (user.value) {
      await fetchProfile()
    }

    // Listen for auth changes
    sb.auth.onAuthStateChange(async (event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null

      if (event === 'SIGNED_IN' && user.value) {
        await fetchProfile()
      }

      if (event === 'SIGNED_OUT') {
        profile.value = null
      }
    })

    loading.value = false
  }

  async function signUp(email: string, password: string) {
    const sb = getSupabase()
    const { data, error } = await sb.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const sb = getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const sb = getSupabase()
    const { error } = await sb.auth.signOut()
    if (error) throw error
    user.value = null
    session.value = null
    profile.value = null
    navigateTo('/')
  }

  async function signInWithProvider(provider: 'google' | string = 'google') {
    const sb = getSupabase()
    const { error } = await sb.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  async function getAccessToken(): Promise<string | null> {
    if (session.value?.access_token) return session.value.access_token
    const sb = getSupabase()
    const { data } = await sb.auth.getSession()
    if (data.session) {
      session.value = data.session
      user.value = data.session.user
      return data.session.access_token
    }
    return null
  }

  async function fetchProfile() {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await $fetch(`${config.public.apiBase}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      profile.value = (response as any).profile
    } catch {
      // Profile does not exist yet (normal for brand new users)
      profile.value = null
    }
  }

  async function createProfile(data: {
    username: string
    display_name?: string
    favorite_club?: string
    region?: string
    efootball_id?: string
  }) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')

    const response = await $fetch(`${config.public.apiBase}/api/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    })
    profile.value = (response as any).profile
    return profile.value
  }

  async function updateProfile(data: Record<string, unknown>) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')

    const response = await $fetch(`${config.public.apiBase}/api/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    })
    profile.value = (response as any).profile
    return profile.value
  }

  const isAuthenticated = computed(() => !!user.value)
  const isOwner = computed(() => profile.value?.role === 'owner')
  const hasProfile = computed(() => !!profile.value)

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    profile: readonly(profile),
    loading: readonly(loading),

    // Computed
    isAuthenticated,
    isOwner,
    hasProfile,

    // Methods
    initialize,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    getAccessToken,
    fetchProfile,
    createProfile,
    updateProfile,
    getSupabase,
  }
}
