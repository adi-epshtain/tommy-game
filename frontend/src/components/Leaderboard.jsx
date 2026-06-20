function Leaderboard({ topPlayers }) {
  if (!topPlayers || topPlayers.length === 0) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E8F5DB, #D4F0BE)', borderRadius: 22, padding: '40px 32px', textAlign: 'center', border: '2px solid #CDE8A8' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🏆</div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: '#4E8C3A', marginBottom: 8 }}>אין עדיין תוצאות</div>
        <p style={{ color: '#7AB85A', fontSize: 15 }}>התחל לשחק כדי לראות את לוח התוצאות!</p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']
  const medalBg = [
    { bg: 'linear-gradient(135deg, #FFF9D0, #FFF0A0)', border: '#F0D060', color: '#8A7020' },
    { bg: 'linear-gradient(135deg, #F0F0F0, #E0E0E0)', border: '#C0C0C0', color: '#606060' },
    { bg: 'linear-gradient(135deg, #FFE8D0, #FFD8B0)', border: '#D4954A', color: '#8A5020' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {topPlayers.map((player, i) => {
        const isMedal = i < 3
        const medal = medalBg[i] || null
        return (
          <div key={i} style={{
            background: isMedal ? medal.bg : 'rgba(255,255,255,0.85)',
            borderRadius: 20,
            padding: '14px 20px',
            border: `2px solid ${isMedal ? medal.border : '#CDE8A8'}`,
            boxShadow: isMedal ? '0 6px 20px rgba(0,0,0,.10)' : '0 3px 10px rgba(110,170,90,.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <div style={{ fontSize: isMedal ? 34 : 20, fontWeight: 700, width: 44, textAlign: 'center', color: isMedal ? medal.color : '#4E8C3A', fontFamily: "'Fredoka', sans-serif", flexShrink: 0 }}>
              {isMedal ? medals[i] : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 19, fontWeight: 700, color: isMedal ? medal.color : '#4E8C3A' }}>
                {player.name}
              </div>
              {isMedal && (
                <div style={{ fontSize: 12, color: isMedal ? medal.color : '#7AB85A', fontWeight: 600, opacity: 0.75 }}>
                  {i === 0 ? 'מקום ראשון' : i === 1 ? 'מקום שני' : 'מקום שלישי'}
                </div>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '8px 18px', border: `1.5px solid ${isMedal ? medal.border : '#CDE8A8'}`, textAlign: 'center', minWidth: 64, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: '#4E8C3A' }}>{player.score}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7AB85A' }}>ניקוד</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Leaderboard
