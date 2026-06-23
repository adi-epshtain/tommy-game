import { useCallback, useEffect, useRef } from 'react'

/*
 * useSpeech — הקראת טקסט בקול דרך ה-Web Speech API של הדפדפן.
 *
 * מובנה בדפדפן, בלי שרת ובלי קבצי קול. תומך בעברית אם מותקן קול עברי
 * במכשיר (ב-Windows + Chrome/Edge בדרך כלל יש). אם אין קול עברי, הדפדפן
 * ינסה להקריא בקול ברירת המחדל — פחות מדויק, אבל לא קורס.
 *
 * שימוש:
 *   const { speak, speakNumber } = useSpeech(isMuted)
 *   speakNumber(2)        // אומר "שתיים"
 *   speak('כל הכבוד')     // אומר טקסט חופשי
 *
 * הערה: דפדפנים חוסמים דיבור לפני אינטראקציה ראשונה של המשתמש (מדיניות
 * autoplay). לכן ייתכן שהמספר הראשון לא יישמע עד שהילד מקיש פעם אחת —
 * מאותו רגע הכל עובד.
 */

// מספרים בעברית בצורת הספירה (נקבה) — כך סופרים בדיבור יומיומי.
const HE_NUMBERS = {
  0: 'אפס', 1: 'אחת', 2: 'שתיים', 3: 'שלוש', 4: 'ארבע',
  5: 'חמש', 6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר',
}

export function useSpeech(isMuted = false) {
  const voiceRef = useRef(null)
  // ref כדי ש-speak יישאר יציב (לא תלוי ב-isMuted) — מונע הקראה חוזרת
  // בכל החלפת מצב השתקה.
  const mutedRef = useRef(isMuted)
  mutedRef.current = isMuted

  // איתור קול עברי (הרשימה נטענת אסינכרונית בחלק מהדפדפנים).
  useEffect(() => {
    const synth = typeof window !== 'undefined' && window.speechSynthesis
    if (!synth) return

    const pickVoice = () => {
      const voices = synth.getVoices()
      voiceRef.current =
        voices.find(v => v.lang && v.lang.toLowerCase().startsWith('he')) || null
    }
    pickVoice()
    synth.addEventListener('voiceschanged', pickVoice)
    return () => synth.removeEventListener('voiceschanged', pickVoice)
  }, [])

  // Mobile browsers (iOS Safari / Android Chrome) block speech that isn't
  // triggered directly by a user gesture. We "unlock" the engine on the very
  // first tap/keypress with a silent utterance — after that, programmatic
  // speech (even from timers) is allowed for the rest of the session.
  useEffect(() => {
    const synth = typeof window !== 'undefined' && window.speechSynthesis
    if (!synth) return

    const unlock = () => {
      try {
        const primer = new SpeechSynthesisUtterance(' ')
        primer.volume = 0 // silent — just to satisfy the gesture requirement
        synth.speak(primer)
        synth.resume()
      } catch {
        /* ignore */
      }
      remove()
    }
    const remove = () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('touchend', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('touchend', unlock)
    document.addEventListener('keydown', unlock)
    return remove
  }, [])

  const speak = useCallback((text) => {
    if (mutedRef.current) return
    const synth = typeof window !== 'undefined' && window.speechSynthesis
    if (!synth) return
    try {
      synth.cancel() // עצור הקראה קודמת כדי שלא יצטברו
      const utter = new SpeechSynthesisUtterance(String(text))
      utter.lang = 'he-IL'
      if (voiceRef.current) utter.voice = voiceRef.current
      utter.rate = 0.85 // קצת לאט — ברור יותר לילד
      utter.pitch = 1.1
      synth.resume() // iOS/Android: ודא שהמנוע לא במצב מושהה
      synth.speak(utter)
    } catch {
      /* דיבור לא זמין — מתעלמים בשקט */
    }
  }, [])

  const speakNumber = useCallback((n) => {
    speak(HE_NUMBERS[n] ?? String(n))
  }, [speak])

  return { speak, speakNumber }
}
