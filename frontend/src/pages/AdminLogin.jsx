import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../services/api'
import Button from '../components/Button'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.adminLogin(username, password)
      if (response && response.access_token) {
        setToken(response.access_token)
        // Small delay to ensure token is saved to localStorage
        setTimeout(() => {
          navigate('/admin', { replace: true })
        }, 100)
      } else {
        setError('תגובה לא תקינה מהשרת - אין access_token')
      }
    } catch (err) {
      setError(`שגיאה: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center" 
      style={{
        backgroundImage: 'url(/static/math_dino2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#654321' }}>
            🔐 כניסת מנהל
          </h1>
          
          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#654321' }}>
                שם משתמש:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#654321' }}>
                סיסמה:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-amber-600"
            >
              חזור להתחברות רגילה
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

