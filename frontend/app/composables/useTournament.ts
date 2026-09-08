export function useTournament() {
  const config = useRuntimeConfig()
  const { getAccessToken } = useAuth()

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // ─── Tournament CRUD ──────────────────────────────────────────────

  async function fetchTournaments(params?: {
    status?: string
    region?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.region) query.set('region', params.region)
    if (params?.search) query.set('search', params.search)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments?${query.toString()}`
    )
    return (response as any).tournaments || []
  }

  async function fetchTournament(id: string) {
    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments/${id}`
    )
    return (response as any).tournament
  }

  async function createTournament(data: {
    name: string
    description?: string
    banner_url?: string
    theme?: string
    ruleset?: string
    eligibility_filter?: Record<string, unknown>
    max_players?: number
    start_date?: string
  }) {
    const headers = await authHeaders()
    const response = await $fetch(`${config.public.apiBase}/api/tournaments`, {
      method: 'POST',
      headers,
      body: data,
    })
    return (response as any).tournament
  }

  async function updateTournament(id: string, data: Record<string, unknown>) {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments/${id}`,
      {
        method: 'PUT',
        headers,
        body: data,
      }
    )
    return (response as any).tournament
  }

  async function joinTournament(id: string) {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments/${id}/join`,
      {
        method: 'POST',
        headers,
      }
    )
    return response
  }

  async function startTournament(id: string) {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments/${id}/start`,
      {
        method: 'POST',
        headers,
      }
    )
    return response
  }

  // ─── Match Operations ─────────────────────────────────────────────

  async function fetchMatches(tournamentId: string) {
    const response = await $fetch(
      `${config.public.apiBase}/api/tournaments/${tournamentId}/matches`
    )
    return (response as any).matches || []
  }

  async function submitScore(matchId: string, score1: number, score2: number) {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/matches/${matchId}/score`,
      {
        method: 'PUT',
        headers,
        body: { score1, score2 },
      }
    )
    return response
  }

  async function updateMatchStatus(matchId: string, status: 'scheduled' | 'live' | 'completed') {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/matches/${matchId}/status`,
      {
        method: 'PUT',
        headers,
        body: { status },
      }
    )
    return response
  }

  async function postLiveUpdate(
    matchId: string,
    data: { live_minute?: number; live_notes?: string; stream_url?: string }
  ) {
    const headers = await authHeaders()
    const response = await $fetch(
      `${config.public.apiBase}/api/matches/${matchId}/live-update`,
      {
        method: 'PUT',
        headers,
        body: data,
      }
    )
    return response
  }

  // ─── Profile ──────────────────────────────────────────────────────

  async function fetchPublicProfile(username: string) {
    const response = await $fetch(
      `${config.public.apiBase}/api/profile/${username}`
    )
    return response
  }

  return {
    fetchTournaments,
    fetchTournament,
    createTournament,
    updateTournament,
    joinTournament,
    startTournament,
    fetchMatches,
    submitScore,
    updateMatchStatus,
    postLiveUpdate,
    fetchPublicProfile,
  }
}
