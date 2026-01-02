import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'

function Signup() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
    <div>
      <h2>הרשמה</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>שם:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label>גיל:</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label>סיסמה:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label>אימות סיסמה:</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'נרשם...' : 'צור משתמש'}
        </button>
      </form>
      <p>כבר יש לך משתמש? <Link to="/login">התחבר</Link></p>
    </div>
  )
}

export default Signup

