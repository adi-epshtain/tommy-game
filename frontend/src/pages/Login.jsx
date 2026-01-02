import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../services/api'
import Button from '../components/Button'

function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login(name, password)
      setToken(data.access_token)
      onLogin()
      navigate('/game')
    } catch (err) {
      setError(`שגיאה בהתחברות: ${err.message}`)
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
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-8 z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#654321' }}>התחברות</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-lg font-semibold mb-2" style={{ color: '#654321' }}>
                שם:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 text-lg border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400 transition-all"
                style={{
                  background: '#FFF8DC',
                  color: '#654321'
                }}
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2" style={{ color: '#654321' }}>
                סיסמה:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 text-lg border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400 transition-all"
                style={{
                  background: '#FFF8DC',
                  color: '#654321'
                }}
              />
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}
            <div className="text-center pt-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'מתחבר...' : 'התחבר'}
              </Button>
            </div>
          </form>
          <p className="text-center mt-4">עדיין אין לך משתמש? <Link to="/signup" className="text-green-600 hover:text-green-700 font-semibold">הרשם כאן</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login

