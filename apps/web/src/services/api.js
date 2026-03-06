const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = {
  async request(method, path, data = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = localStorage.getItem('waiichia_token')
      if (token) headers['Authorization'] = 'Bearer ' + token
    }
    const res = await fetch(API_URL + path, {
      method, headers,
      body: data !== null && data !== undefined ? JSON.stringify(data) : undefined
    })
    const json = await res.json()
    return json
  },
  get:    (path, auth) => api.request('GET',    path, null, auth),
  post:   (path, data, auth) => api.request('POST',   path, data, auth),
  patch:  (path, data, auth) => api.request('PATCH',  path, data, auth),
  delete: (path, auth) => api.request('DELETE', path, null, auth),

  auth: {
    register: (d) => api.post('/api/auth/register', d, false),
    login:    (d) => api.post('/api/auth/login', d, false),
    me:       ()  => api.get('/api/auth/me'),
    logout:   ()  => api.post('/api/auth/logout', {}),
  },
  tracks: {
    list:     (q = '') => api.get('/api/tracks/' + q),
    trending: ()       => api.get('/api/tracks/trending'),
    get:      (id)     => api.get('/api/tracks/' + id),
    play:     (id)     => api.post('/api/tracks/' + id + '/play', {}),
    create:   (d)      => api.post('/api/tracks/', d),
    update:   (id, d)  => api.patch('/api/tracks/' + id, d),
    delete:   (id)     => api.delete('/api/tracks/' + id),
    myTracks: ()       => api.get('/api/tracks/my/tracks'),
    access:   (id)     => api.get('/api/tracks/' + id + '/access'),
  },
  profiles: {
    stats:    ()         => api.get('/api/profiles/stats', false),
    get:      (username) => api.get('/api/profiles/' + username, false),
    update:   (d)        => api.patch('/api/profiles/me', d),
    follow:   (username) => api.post('/api/profiles/' + username + '/follow', {}),
    unfollow: (username) => api.delete('/api/profiles/' + username + '/follow'),
    tracks:   (username) => api.get('/api/profiles/' + username + '/tracks', false),
    list:     (q = '')   => api.get('/api/profiles/' + q, false),
  },
  social: {
    react:         (d)        => api.post('/api/social/react', d),
    reactions:     (type, id) => api.get('/api/social/reactions/' + type + '/' + id, false),
    comment:       (d)        => api.post('/api/social/comment', d),
    comments:      (type, id) => api.get('/api/social/comments/' + type + '/' + id, false),
    feed:          ()         => api.get('/api/social/feed'),
    notifications: ()         => api.get('/api/social/notifications'),
    report:        (d)        => api.post('/api/social/reports', d),
  },
  payments: {
    wallet:        () => api.get('/api/payments/wallet'),
    walletBalance: () => api.get('/api/wallet/balance'),
    history:       () => api.get('/api/payments/history'),
    rentals:       () => api.get('/api/payments/rentals'),
    invoices:      () => api.get('/api/payments/invoices'),
    tickets:       () => api.get('/api/payments/tickets'),
    recharge:      (d) => api.post('/api/payments/recharge', d),
    buyTrack:      (d) => api.post('/api/payments/track', d),
    withdraw:      (d) => api.post('/api/payments/withdraw', d),
    transfer:      (d) => api.post('/api/payments/transfer', d),
  },
  emissions: {
    list:     (q = '') => api.get('/api/emissions/' + q, false),
    get:      (id)     => api.get('/api/emissions/' + id, false),
    episodes: (id)     => api.get('/api/emissions/' + id + '/episodes', false),
    create:   (d)      => api.post('/api/emissions/', d),
  },
  radio: {
    list: (q = '') => api.get('/api/radio/' + q, false),
    get:  (id)     => api.get('/api/radio/' + id, false),
    tip:  (id, d)  => api.post('/api/radio/' + id + '/tip', d),
  },
  karaoke: {
    tracks:     ()   => api.get('/api/karaoke/tracks', false),
    track:      (id) => api.get('/api/karaoke/tracks/' + id, false),
    duets:      ()   => api.get('/api/karaoke/duets', false),
    recordings: ()   => api.get('/api/karaoke/recordings/my'),
    save:       (d)  => api.post('/api/karaoke/recordings', d),
  },
  events: {
    list:     (q = '') => api.get('/api/events/' + q, false),
    get:      (id)     => api.get('/api/events/' + id, false),
    buy:      (d)      => api.post('/api/events/tickets', d),
    myEvents: ()       => api.get('/api/events/my/events'),
  },
  campaigns: {
    list:   ()   => api.get('/api/campaigns/'),
    create: (d)  => api.post('/api/campaigns/', d),
    stats:  (id) => api.get('/api/campaigns/' + id + '/stats'),
  },
  products: {
    list:   (q = '') => api.get('/api/products/' + q, false),
    buy:    (d)      => api.post('/api/products/buy', d),
    my:     ()       => api.get('/api/products/my/products'),
    create: (d)      => api.post('/api/products/', d),
  },
  messages: {
    conversations: () => api.get('/api/messages/conversations'),
    messages: (id)    => api.get('/api/messages/' + id),
    send:     (d)     => api.post('/api/messages/', d),
  },
}

export default api
