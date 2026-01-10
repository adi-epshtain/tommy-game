const API_BASE = ''

export const getToken = () => localStorage.getItem('token')
export const setToken = (token) => localStorage.setItem('token', token)
export const removeToken = () => localStorage.removeItem('token')

const getHeaders = (includeAuth = true) => {
  const headers = {}
  if (includeAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return headers
}

export const api = {
  async login(username, password) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async signup(name, age, password) {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age, password })
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getPlayerInfo() {
    const response = await fetch(`${API_BASE}/api/player_info`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to get player info')
    }
    
    return response.json()
  },

  async startGame(playerAge = 5, advanceStage = null) {
    const body = { player_age: parseInt(playerAge) }
    if (advanceStage !== null) {
      body.advance_stage = advanceStage
    }
    
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error('Failed to start game')
    }
    
    return response.json()
  },

  async submitAnswer(answer, questionId, gameName) {
    const response = await fetch(`${API_BASE}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify({
        answer: parseInt(answer),
        question_id: questionId,
        game_name: gameName
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to submit answer')
    }
    
    return response.json()
  },

  async getGameEnd() {
    const response = await fetch(`${API_BASE}/api/game_end`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to get game end data')
    }
    
    return response.json()
  },

  async getPlayerStats() {
    const response = await fetch(`${API_BASE}/player_sessions_stats`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getTopPlayers() {
    const response = await fetch(`${API_BASE}/api/top_players`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getCurrentGameState() {
    const response = await fetch(`${API_BASE}/api/current_game_state`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to get current game state')
    }
    
    return response.json()
  },

  async saveSettings(difficulty, winningScore, currentStage = null) {
    const body = {
      difficulty: difficulty,
      winning_score: winningScore
    }
    
    if (currentStage !== null) {
      body.current_stage = currentStage
    }
    
    const response = await fetch(`${API_BASE}/set_game_settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save settings')
    }
    
    return response.json()
  },

  // Admin APIs
  async adminLogin(username, password) {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getPlayers(page = 1, pageSize = 10, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    })
    if (search) {
      params.append('search', search)
    }
    
    const response = await fetch(`${API_BASE}/admin/players?${params}`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getPlayerStatsAdmin(playerId) {
    const response = await fetch(`${API_BASE}/admin/players/${playerId}/stats`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async getPlayerTrends(playerId, period = 'week') {
    const response = await fetch(`${API_BASE}/admin/players/${playerId}/trends?period=${period}`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async comparePlayerPeriods(playerId, period1Start, period1End, period2Start, period2End) {
    const params = new URLSearchParams({
      period1_start: period1Start,
      period1_end: period1End,
      period2_start: period2Start,
      period2_end: period2End
    })
    
    const response = await fetch(`${API_BASE}/admin/players/${playerId}/compare?${params}`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async deletePlayer(playerId) {
    const response = await fetch(`${API_BASE}/admin/players/${playerId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    
    return response.json()
  },

  async excludePlayerFromLeaderboard(playerId) {
    const response = await fetch(`${API_BASE}/admin/players/${playerId}/exclude-from-leaderboard`, {
      method: 'POST',
      headers: getHeaders()
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    return response.json()
  },

  async includePlayerInLeaderboard(playerId) {
    const response = await fetch(`${API_BASE}/admin/players/${playerId}/include-in-leaderboard`, {
      method: 'POST',
      headers: getHeaders()
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || response.statusText)
    }
    return response.json()
  }
}

