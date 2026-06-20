export function useSounds(isMuted) {
  const playCelebrationSound = () => {
    if (isMuted) return
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 0.5
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        let sample = 0
        for (let clap = 0; clap < 5; clap++) {
          const clapTime = t - clap * 0.1
          if (clapTime >= 0 && clapTime < 0.3) {
            const freq = 200 + clap * 50 + Math.random() * 100
            const envelope = Math.exp(-clapTime * 10) * (1 - clapTime / 0.3)
            sample += Math.sin(2 * Math.PI * freq * clapTime) * envelope * 0.3
          }
        }
        sample += (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 5)
        data[i] = Math.max(-1, Math.min(1, sample))
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    } catch (err) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (e) {
        console.log('Audio not available')
      }
    }
  }

  const playErrorSound = () => {
    if (isMuted) return
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 0.6
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        let sample = 0
        for (let oy = 0; oy < 3; oy++) {
          const oyStart = oy * 0.15
          const oyDuration = 0.12
          if (t >= oyStart && t < oyStart + oyDuration) {
            const localTime = t - oyStart
            const startFreq = 300 - oy * 30
            const endFreq = 200 - oy * 20
            const freq = startFreq + (endFreq - startFreq) * (localTime / oyDuration)
            const envelope = Math.sin(Math.PI * localTime / oyDuration) * 0.4
            sample += Math.sin(2 * Math.PI * freq * localTime) * envelope
          }
        }
        if (t < 0.5) {
          sample += Math.sin(2 * Math.PI * 80 * t) * 0.1 * Math.exp(-t * 3)
        }
        data[i] = Math.max(-1, Math.min(1, sample))
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    } catch (err) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.4)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
      } catch (e) {
        console.log('Audio not available')
      }
    }
  }

  const playTop3VictorySound = (rank) => {
    if (isMuted) return
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const baseFreq = 440
      const notes = rank === 1
        ? [0, 4, 7, 12, 16, 19, 16, 12]
        : rank === 2
        ? [0, 3, 7, 10, 12]
        : [0, 2, 5, 9]

      const duration = 3.5
      const noteDuration = duration / notes.length
      const startTime = audioContext.currentTime

      notes.forEach((semitone, index) => {
        const freq = baseFreq * Math.pow(2, semitone / 12)
        const noteStart = startTime + index * noteDuration
        const attackTime = 0.05
        const sustainTime = noteDuration * 0.6
        const decayTime = noteDuration * 0.35
        const volume = rank === 1 ? 0.4 : rank === 2 ? 0.35 : 0.3

        oscillator.frequency.setValueAtTime(freq, noteStart)
        gainNode.gain.setValueAtTime(0, noteStart)
        gainNode.gain.linearRampToValueAtTime(volume, noteStart + attackTime)
        gainNode.gain.setValueAtTime(volume, noteStart + attackTime + sustainTime)
        gainNode.gain.linearRampToValueAtTime(0, noteStart + attackTime + sustainTime + decayTime)
      })

      oscillator.type = 'sine'
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.1)
    } catch (err) {
      playCelebrationSound()
    }
  }

  return { playCelebrationSound, playErrorSound, playTop3VictorySound }
}
