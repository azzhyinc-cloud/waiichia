const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = {
  async request(method, path, data = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = localStorage.getItem('waiichia_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erreur serveur')
    return json
  },
  get: (path, auth) => api.request('GET', path, null, auth),
  post: (path, data, auth) => api.request('POST', path, data, auth),
  patch: (path, data, auth) => api.request('PATCH', path, data, auth),
  delete: (path, auth) => api.request('DELETE', path, null, auth),

  auth: {
    register: (d) => api.post('/api/auth/register', d, false),
    login: (d) => api.post('/api/auth/login', d, false),
    me: () => api.get('/api/auth/me'),
    logout: () => api.post('/api/auth/logout', {}),
  },
  tracks: {
    list: (q = '') => api.get(`/api/tracks/${q}`),
    trending: () => api.get('/api/tracks/trending'),
    get: (id) => api.get(`/api/tracks/${id}`),
    play: (id) => api.post(`/api/tracks/${id}/play`, {}),
    create: (d) => api.post('/api/tracks/', d),
    update: (id, d) => api.patch(`/api/tracks/${id}`, d),
    myTracks: () => api.get('/api/tracks/my/tracks'),
    access: (id) => api.get(`/api/tracks/${id}/access`),
  },
  profiles: {
    get: (username) => api.get(`/api/profiles/${username}`),
    update: (d) => api.patch('/api/profiles/me', d),
    follow: (username) => api.post(`/api/profiles/${username}/follow`, {}),
    unfollow: (username) => api.delete(`/api/profiles/${username}/follow`),
    tracks: (username) => api.get(`/api/profiles/${username}/tracks`),
  },
  social: {
    react: (d) => api.post('/api/social/react', d),
    reactions: (type, id) => api.get(`/api/social/reactions/${type}/${id}`, false),
    comment: (d) => api.post('/api/social/comment', d),
    comments: (type, id) => api.get(`/api/social/comments/${type}/${id}`, false),
    feed: () => api.get('/api/social/feed'),
    notifications: () => api.get('/api/social/notifications'),
  },
  payments: {
    initiate: (d) => api.post('/api/payments/initiate', d),
    wallet: () => api.get('/api/payments/wallet'),
    history: () => api.get('/api/payments/history'),
    rentals: () => api.get('/api/payments/rentals'),
    invoices: () => api.get('/api/payments/invoices'),
  }
}

export default api
