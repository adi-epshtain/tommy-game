function Leaderboard({ topPlayers }) {
  if (!topPlayers || topPlayers.length === 0) {
    return <p>אין עדיין תוצאות להצגה</p>
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <table style={{
      margin: 'auto',
      borderCollapse: 'collapse',
      width: '50%',
      maxWidth: '600px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <thead>
        <tr>
          <th style={{ backgroundColor: '#4CAF50', color: 'white', padding: '12px' }}>מקום</th>
          <th style={{ backgroundColor: '#4CAF50', color: 'white', padding: '12px' }}>שם</th>
          <th style={{ backgroundColor: '#4CAF50', color: 'white', padding: '12px' }}>ניקוד</th>
        </tr>
      </thead>
      <tbody>
        {topPlayers.map((player, i) => (
          <tr key={i} style={{
            backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white'
          }}>
            <td style={{ padding: '10px' }}>
              {i < 3 ? <span style={{ fontSize: '1.2em' }}>{medals[i]}</span> : i + 1}
            </td>
            <td style={{ padding: '10px' }}>{player.name}</td>
            <td style={{ padding: '10px' }}>{player.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Leaderboard

