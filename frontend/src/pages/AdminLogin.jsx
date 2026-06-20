import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../services/api'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.adminLogin(username, password)
      if (response && response.access_token) {
        setToken(response.access_token)
        setTimeout(() => navigate('/admin', { replace: true }), 100)
      } else {
        setError('תגובה לא תקינה מהשרת')
      }
    } catch (err) {
      setError(`שגיאה: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '11px 16px',
    fontSize: 17,
    border: '2.5px solid #CDE8A8',
    borderRadius: 16,
    background: '#FAFFF6',
    color: '#333',
    outline: 'none',
    fontFamily: "'Varela Round', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        background: 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)',
      }}
    >
      {/* Cloud 1 */}
      <div style={{
        position: 'absolute', top: '10%', right: '10%',
        width: 150, height: 54, background: '#fff', opacity: .7,
        borderRadius: 60, boxShadow: '-36px 8px 0 -6px #fff, 34px 6px 0 -10px #fff',
        animation: 'tg-floatslow 9s ease-in-out infinite', pointerEvents: 'none',
      }}/>
      {/* Cloud 2 */}
      <div style={{
        position: 'absolute', top: '22%', left: '8%',
        width: 110, height: 42, background: '#fff', opacity: .6,
        borderRadius: 60, boxShadow: '-26px 6px 0 -6px #fff',
        animation: 'tg-floatslow 12s ease-in-out infinite', pointerEvents: 'none',
      }}/>

      {/* Green hills */}
      <div style={{ position: 'absolute', bottom: -60, right: -40, width: '60%', height: 220, background: 'radial-gradient(120% 100% at 50% 0, #A9E08A, #7FCB6A)', borderRadius: '50% 50% 0 0 / 100% 100% 0 0', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: -70, left: -40, width: '54%', height: 190, background: 'radial-gradient(120% 100% at 50% 0, #95D870, #6BBD56)', borderRadius: '50% 50% 0 0 / 100% 100% 0 0', pointerEvents: 'none' }}/>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 380, margin: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 36,
          padding: '40px 32px 32px',
          boxShadow: '0 24px 56px rgba(78,120,50,.28)',
        }}>
          <div style={{ textAlign: 'center', fontSize: 44, marginBottom: 4 }}>🔐</div>
          <h1 style={{
            fontFamily: "'Fredoka', 'Varela Round', sans-serif",
            fontSize: 28, fontWeight: 700, color: '#4E8C3A',
            textAlign: 'center', margin: '0 0 24px',
          }}>
            כניסת מנהל
          </h1>

          {error && (
            <div style={{ background: '#FFF0F0', border: '2px solid #FFB0B0', color: '#C0392B', borderRadius: 14, padding: '10px 16px', marginBottom: 16, fontSize: 14, textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 15, color: '#4E8C3A', marginBottom: 6 }}>שם משתמש:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                style={fieldStyle}
                onFocus={e => { e.target.style.borderColor = '#6AB840' }}
                onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 15, color: '#4E8C3A', marginBottom: 6 }}>סיסמה:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ ...fieldStyle, paddingLeft: 40 }}
                  onFocus={e => { e.target.style.borderColor = '#6AB840' }}
                  onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, color: '#7AB85A', display: 'flex', alignItems: 'center',
                  }}
                  title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 24px', fontSize: 17, fontWeight: 700,
                color: '#fff', background: loading ? '#88C87A' : '#52C36E',
                border: 'none', borderRadius: 999,
                boxShadow: loading || pressed ? '0 4px 0 #36A452' : '0 8px 0 #36A452',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Fredoka', 'Varela Round', sans-serif",
                transform: pressed ? 'translateY(4px)' : 'translateY(0)',
                transition: 'transform .1s, box-shadow .1s',
              }}
              onMouseDown={() => { if (!loading) setPressed(true) }}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', fontSize: 14, color: '#7AB85A', cursor: 'pointer', fontFamily: "'Varela Round', sans-serif", fontWeight: 600 }}
            >
              ← חזור להתחברות רגילה
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
