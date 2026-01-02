function Leaderboard({ topPlayers }) {
  if (!topPlayers || topPlayers.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 text-center border-2 border-blue-200 shadow-lg">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-2xl font-bold mb-2" style={{ color: '#654321' }}>אין עדיין תוצאות</h3>
        <p className="text-lg text-gray-600">עדיין לא היו משחקים. התחל לשחק כדי לראות את לוח התוצאות!</p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']
  const medalColors = [
    'from-yellow-100 to-yellow-200 border-yellow-400',
    'from-gray-100 to-gray-200 border-gray-400',
    'from-amber-100 to-amber-200 border-amber-400'
  ]

  return (
    <div className="space-y-3">
      {topPlayers.map((player, i) => (
        <div
          key={i}
          className={`rounded-xl p-4 shadow-lg border-2 transition-all hover:shadow-xl ${
            i < 3 
              ? `bg-gradient-to-br ${medalColors[i]}` 
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className={`text-3xl font-bold w-12 text-center ${
                i < 3 ? 'text-4xl' : ''
              }`}>
                {i < 3 ? medals[i] : <span style={{ color: '#654321' }}>{i + 1}</span>}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold" style={{ color: '#654321' }}>
                  {player.name}
                </div>
                {i < 3 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {i === 0 ? 'מקום ראשון' : i === 1 ? 'מקום שני' : 'מקום שלישי'}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border-2 border-gray-300 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{player.score}</div>
                <div className="text-xs font-semibold text-gray-600">ניקוד</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Leaderboard

