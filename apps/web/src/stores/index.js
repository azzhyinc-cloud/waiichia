import { create } from 'zustand'
import api from '../services/api.js'

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('waiichia_theme') || 'dark',
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('waiichia_theme', next)
    document.documentElement.setAttribute('data-theme', next)
    set({ theme: next })
  },
  init: () => {
    const t = localStorage.getItem('waiichia_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  }
}))

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('waiichia_token'),
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await api.auth.login({ email, password })
      localStorage.setItem('waiichia_token', data.token)
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
  register: async (form) => {
    set({ loading: true, error: null })
    try {
      const data = await api.auth.register(form)
      set({ loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
  loadMe: async () => {
    const token = localStorage.getItem('waiichia_token')
    if (!token) return
    try {
      const data = await api.auth.me()
      set({ user: data.profile })
    } catch {
      localStorage.removeItem('waiichia_token')
      set({ user: null, token: null })
    }
  },
  logout: () => {
    localStorage.removeItem('waiichia_token')
    set({ user: null, token: null })
  },
  isAuthenticated: () => !!localStorage.getItem('waiichia_token'),
}))

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  audio: null,
  play: (track) => {
    const { audio } = get()
    if (audio) { audio.pause(); audio.src = '' }
    const newAudio = new Audio(track.audio_url_128 || track.audio_url_320)
    newAudio.volume = get().volume
    newAudio.ontimeupdate = () => set({ progress: newAudio.currentTime })
    newAudio.onloadedmetadata = () => set({ duration: newAudio.duration })
    newAudio.onended = () => get().playNext()
    newAudio.play().catch(() => {})
    api.tracks.play(track.id).catch(() => {})
    set({ currentTrack: track, isPlaying: true, audio: newAudio, progress: 0 })
  },
  pause: () => {
    const { audio } = get()
    if (audio) audio.pause()
    set({ isPlaying: false })
  },
  resume: () => {
    const { audio } = get()
    if (audio) { audio.play().catch(() => {}); set({ isPlaying: true }) }
  },
  seek: (time) => {
    const { audio } = get()
    if (audio) { audio.currentTime = time; set({ progress: time }) }
  },
  setVolume: (vol) => {
    const { audio } = get()
    if (audio) audio.volume = vol
    set({ volume: vol })
  },
  setQueue: (tracks) => set({ queue: tracks }),
  playNext: () => {
    const { queue, currentTrack } = get()
    if (!queue.length) return
    const idx = queue.findIndex(t => t.id === currentTrack?.id)
    const next = queue[idx + 1] || queue[0]
    if (next) get().play(next)
  },
  playPrev: () => {
    const { queue, currentTrack } = get()
    if (!queue.length) return
    const idx = queue.findIndex(t => t.id === currentTrack?.id)
    const prev = queue[idx - 1] || queue[queue.length - 1]
    if (prev) get().play(prev)
  },
  toggle: (track) => {
    const { currentTrack, isPlaying } = get()
    if (currentTrack?.id === track.id) {
      isPlaying ? get().pause() : get().resume()
    } else {
      get().play(track)
    }
  }
}))

export const usePageStore = create((set) => ({
  currentPage: 'home',
  setPage: (page) => set({ currentPage: page })
}))
