import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../services/api'

const PinkBear = () => (
  <svg viewBox="0 0 160 170" width="100%" height="auto">
    <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)"/>
    <path d="M50 40 Q56 20 64 40 Z" fill="#EC8FB4"/>
    <path d="M72 32 Q80 10 88 32 Z" fill="#EC8FB4"/>
    <path d="M96 40 Q104 20 110 40 Z" fill="#EC8FB4"/>
    <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#F6A8C8"/>
    <ellipse cx="58" cy="156" rx="16" ry="10" fill="#F6A8C8"/>
    <ellipse cx="102" cy="156" rx="16" ry="10" fill="#F6A8C8"/>
    <ellipse cx="30" cy="106" rx="11" ry="16" fill="#F6A8C8"/>
    <ellipse cx="130" cy="106" rx="11" ry="16" fill="#F6A8C8"/>
    <ellipse cx="80" cy="112" rx="33" ry="37" fill="#FFE9F1"/>
    <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff"/>
    <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff"/>
    <circle cx="64" cy="84" r="8" fill="#4A3550"/>
    <circle cx="96" cy="84" r="8" fill="#4A3550"/>
    <circle cx="67" cy="81" r="3" fill="#fff"/>
    <circle cx="99" cy="81" r="3" fill="#fff"/>
    <ellipse cx="46" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65"/>
    <ellipse cx="114" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65"/>
    <path d="M68 102 Q80 114 92 102" fill="none" stroke="#4A3550" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M114 46 L99 38 L99 56 Z" fill="#FF7FA8"/>
    <path d="M114 46 L129 38 L129 56 Z" fill="#FF7FA8"/>
    <circle cx="114" cy="46" r="5" fill="#EC5E92"/>
  </svg>
)

function Login({ onLogin }) {
  const [name, setName] = useState('')
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
      const data = await api.login(name, password)
      setToken(data.access_token)
      onLogin()
      navigate('/game-select')
    } catch (err) {
      setError(`שגיאה בהתחברות: ${err.message}`)
    } finally {
      setLoading(false)
    }
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
        background: 'linear-gradient(180deg, #CDEBFF 0%, #DDF3D4 52%, #A9DE84 100%)',
      }}
    >
      {/* Cloud 1 */}
      <div style={{
        position: 'absolute', top: '8%', right: '10%',
        width: 170, height: 60, background: '#fff', opacity: .78,
        borderRadius: 60, boxShadow: '-44px 8px 0 -6px #fff, 40px 6px 0 -10px #fff',
        animation: 'tg-floatslow 9s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      {/* Cloud 2 */}
      <div style={{
        position: 'absolute', top: '20%', left: '8%',
        width: 130, height: 48, background: '#fff', opacity: .65,
        borderRadius: 60, boxShadow: '-32px 6px 0 -6px #fff',
        animation: 'tg-floatslow 12s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      {/* Green hills at bottom */}
      <div style={{
        position: 'absolute', bottom: -60, right: -40,
        width: '62%', height: 240,
        background: 'radial-gradient(120% 100% at 50% 0, #A9E08A, #7FCB6A)',
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -70, left: -40,
        width: '55%', height: 210,
        background: 'radial-gradient(120% 100% at 50% 0, #95D870, #6BBD56)',
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        pointerEvents: 'none',
      }}/>

      {/* Dinosaurs at bottom */}
      <img src="/static/dino_1.png" alt="" className="tg-deco-dino" style={{ position: 'absolute', bottom: 30, left: 16, height: 'clamp(120px, 18vw, 175px)', objectFit: 'contain', filter: 'drop-shadow(3px 6px 8px rgba(0,0,0,0.22))', pointerEvents: 'none', zIndex: 3 }} onError={e => { e.target.style.display = 'none' }} />
      <img src="/static/dino_2.png" alt="" className="tg-deco-dino" style={{ position: 'absolute', bottom: 30, left: 175, height: 'clamp(105px, 16vw, 150px)', objectFit: 'contain', filter: 'drop-shadow(3px 6px 8px rgba(0,0,0,0.22))', pointerEvents: 'none', zIndex: 3 }} onError={e => { e.target.style.display = 'none' }} />
      <img src="/static/dino_3.png" alt="" className="tg-deco-dino" style={{ position: 'absolute', bottom: 30, right: 175, height: 'clamp(105px, 16vw, 150px)', objectFit: 'contain', filter: 'drop-shadow(3px 6px 8px rgba(0,0,0,0.22))', pointerEvents: 'none', zIndex: 3 }} onError={e => { e.target.style.display = 'none' }} />
      <img src="/static/dino_4.png" alt="" className="tg-deco-dino" style={{ position: 'absolute', bottom: 30, right: 16, height: 'clamp(120px, 18vw, 175px)', objectFit: 'contain', filter: 'drop-shadow(3px 6px 8px rgba(0,0,0,0.22))', pointerEvents: 'none', zIndex: 3 }} onError={e => { e.target.style.display = 'none' }} />

      {/* Card area */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        width: '100%',
        maxWidth: 400,
        margin: '0 20px',
      }}>
        {/* Bear mascot floating above card */}
        <div style={{
          width: 120,
          margin: '0 auto -30px',
          position: 'relative',
          zIndex: 6,
          animation: 'tg-float 3.5s ease-in-out infinite',
        }}>
          <PinkBear />
        </div>

        {/* White card */}
        <div style={{
          background: '#fff',
          borderRadius: 42,
          padding: '44px 36px 32px',
          boxShadow: '0 28px 64px rgba(78,120,50,.32)',
          position: 'relative',
          zIndex: 5,
        }}>
          <h2 style={{
            fontFamily: "'Fredoka', 'Varela Round', sans-serif",
            fontSize: 34,
            fontWeight: 700,
            color: '#4E8C3A',
            textAlign: 'center',
            margin: '0 0 6px',
            letterSpacing: 0.5,
          }}>
            ברוכים הבאים!
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#7AB85A',
            fontSize: 15,
            margin: '0 0 28px',
          }}>
            התחבר למשחק של טומי
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name field */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{
                fontWeight: 700, fontSize: 18, color: '#4E8C3A',
                width: 68, flexShrink: 0, textAlign: 'right',
              }}>שם:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '12px 16px',
                  fontSize: 19,
                  border: '3px solid #CDE8A8',
                  borderRadius: 18,
                  background: '#FAFFF6',
                  color: '#333',
                  outline: 'none',
                  fontFamily: "'Varela Round', sans-serif",
                  boxShadow: 'inset 0 2px 4px rgba(110,170,90,.08)',
                  transition: 'border-color .15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#6AB840' }}
                onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
              />
            </div>

            {/* Password field */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <label style={{
                fontWeight: 700, fontSize: 18, color: '#4E8C3A',
                width: 68, flexShrink: 0, textAlign: 'right',
              }}>סיסמא:</label>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center', maxWidth: 'none' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    fontSize: 19,
                    border: '3px solid #CDE8A8',
                    borderRadius: 18,
                    background: '#FAFFF6',
                    color: '#333',
                    outline: 'none',
                    fontFamily: "'Varela Round', sans-serif",
                    boxShadow: 'inset 0 2px 4px rgba(110,170,90,.08)',
                    transition: 'border-color .15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#6AB840' }}
                  onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמא' : 'הצג סיסמא'}
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, border: 'none', borderRadius: '50%',
                    background: 'transparent', cursor: 'pointer', padding: 0,
                  }}
                  title={showPassword ? 'הסתר' : 'הצג'}
                >
                  {showPassword ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6FA84E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.16 3.19"/>
                      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.66-1.27"/>
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6FA84E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FFF0F0', border: '2px solid #FFB0B0', color: '#C0392B',
                borderRadius: 14, padding: '10px 16px', marginBottom: 16,
                fontSize: 14, textAlign: 'center', fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px 24px',
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                background: loading ? '#88C87A' : '#52C36E',
                border: 'none',
                borderRadius: 999,
                boxShadow: loading || pressed ? '0 4px 0 #36A452' : '0 8px 0 #36A452',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Fredoka', 'Varela Round', sans-serif",
                transform: pressed ? 'translateY(4px)' : 'translateY(0)',
                transition: 'transform .1s, box-shadow .1s',
                letterSpacing: 0.5,
              }}
              onMouseDown={() => { if (!loading) setPressed(true) }}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
            >
              {loading ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 15, color: '#666' }}>
            עדיין אין לך משתמש?{' '}
            <Link to="/signup" style={{ color: '#4E8C3A', fontWeight: 700, textDecoration: 'none' }}>
              הרשם כאן
            </Link>
          </p>

          <div style={{
            textAlign: 'center', marginTop: 14,
            paddingTop: 14, borderTop: '1.5px solid #E8F5DB',
          }}>
            <Link to="/admin/login" style={{ fontSize: 13, color: '#AAA', textDecoration: 'none', fontWeight: 600 }}>
              🔧 התחבר כמנהל
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
