import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Game from './pages/Game'
import PlayerStats from './pages/PlayerStats'
import TopPlayers from './pages/TopPlayers'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { getToken } from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return <div>טוען...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
      <Route path="/signup" element={<Signup />} />
      <Route 
        path="/game" 
        element={
          isAuthenticated ? 
            <Game onLogout={() => setIsAuthenticated(false)} /> : 
            <Navigate to="/login" />
        } 
      />
      <Route 
        path="/player_stats" 
        element={
          isAuthenticated ? 
            <PlayerStats /> : 
            <Navigate to="/login" />
        } 
      />
      <Route 
        path="/top_players" 
        element={
          isAuthenticated ? 
            <TopPlayers /> : 
            <Navigate to="/login" />
        } 
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin" 
        element={
          getToken() ? 
            <AdminDashboard /> : 
            <Navigate to="/admin/login" />
        } 
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App

