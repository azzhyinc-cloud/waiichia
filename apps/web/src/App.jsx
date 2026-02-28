import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/index.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Player from './components/Player.jsx'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('waiichia_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const loadMe = useAuthStore(s => s.loadMe)

  useEffect(() => { loadMe() }, [])

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Player />
      </div>
    </BrowserRouter>
  )
}
