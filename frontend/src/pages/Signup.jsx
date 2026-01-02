import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import Button from '../components/Button'

function Signup() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Shared input styles for consistency
  const inputStyle = {
    background: '#FFF8DC',
    color: '#654321'
  }

  const inputClasses = "w-full px-4 py-3 text-lg border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400 transition-all"

  const isStrongPassword = (pwd) => {
    return pwd.length >= 6 && /[0-9]/.test(pwd)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('הסיסמאות אינן תואמות.')
      return
    }

    if (!isStrongPassword(password)) {
      setError('הסיסמה חייבת להיות לפחות 6 תווים ולכלול ספרה.')
      return
    }

    setLoading(true)

    try {
      await api.signup(name, parseInt(age), password)
      alert('נרשמת בהצלחה! עכשיו תוכל להתחבר.')
      navigate('/login')
    } catch (err) {
      setError(`שגיאה בהרשמה: ${err.message}`)
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
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#654321' }}>הרשמה</h2>
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
                className={inputClasses}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2" style={{ color: '#654321' }}>
                גיל:
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                disabled={loading}
                className={inputClasses}
                style={inputStyle}
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
                className={inputClasses}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2" style={{ color: '#654321' }}>
                אימות סיסמה:
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                disabled={loading}
                className={inputClasses}
                style={inputStyle}
              />
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}
            <div className="pt-2 text-center">
              <Button type="submit" disabled={loading}>
                {loading ? 'נרשם...' : 'צור משתמש'}
              </Button>
            </div>
          </form>
          <p className="text-center mt-4">כבר יש לך משתמש? <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">התחבר</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Signup

