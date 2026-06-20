/*
 * Mascots — דמויות מנחה למשחק טומי.
 *
 * שש דמויות וקטוריות (SVG) שאפשר לשבץ בכל מסך כדמות מלווה/מנחה.
 * יתרון על קבצי PNG: חדות בכל גודל, משקל אפס, וצבעים/אנימציה דינמיים.
 *
 * שימוש:
 *   import { Mascot, MascotGuide, MASCOTS } from '../components/Mascots'
 *
 *   <Mascot name="dino" size={120} float />
 *   <MascotGuide name="unicorn" message="כל הכבוד! ענית נכון 🎉" />
 *
 * הקובץ עצמאי ולא מחובר לשום מסך — חיבור נעשה במקום השימוש.
 */

// הזרקת keyframes פעם אחת (ריחוף עדין של הדמות).
const FLOAT_KEYFRAMES = `
@keyframes mascot-float {
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  50%      { transform: translateY(-10px) rotate(1.5deg); }
}`

function FloatStyle() {
  return <style>{FLOAT_KEYFRAMES}</style>
}

/* ---------- הדמויות עצמן ---------- */

function DinoMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <path d="M50 40 Q56 20 64 40 Z" fill="#EC8FB4" />
      <path d="M72 32 Q80 10 88 32 Z" fill="#EC8FB4" />
      <path d="M96 40 Q104 20 110 40 Z" fill="#EC8FB4" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#F6A8C8" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#F6A8C8" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#F6A8C8" />
      <ellipse cx="30" cy="106" rx="11" ry="16" fill="#F6A8C8" />
      <ellipse cx="130" cy="106" rx="11" ry="16" fill="#F6A8C8" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#FFE9F1" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#4A3550" />
      <circle cx="96" cy="84" r="8" fill="#4A3550" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65" />
      <ellipse cx="114" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65" />
      <path d="M68 102 Q80 114 92 102" fill="none" stroke="#4A3550" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M114 46 L99 38 L99 56 Z" fill="#FF7FA8" />
      <path d="M114 46 L129 38 L129 56 Z" fill="#FF7FA8" />
      <circle cx="114" cy="46" r="5" fill="#EC5E92" />
    </svg>
  )
}

function UnicornMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <path d="M52 42 L46 14 L70 35 Z" fill="#C9B6F2" />
      <path d="M108 42 L114 14 L90 35 Z" fill="#C9B6F2" />
      <path d="M80 36 L73 2 L87 2 Z" fill="#FFD56B" stroke="#F0B84A" strokeWidth="2" strokeLinejoin="round" />
      <line x1="80" y1="6" x2="80" y2="32" stroke="#F0B84A" strokeWidth="2" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#C9B6F2" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#C9B6F2" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#C9B6F2" />
      <ellipse cx="30" cy="106" rx="11" ry="16" fill="#C9B6F2" />
      <ellipse cx="130" cy="106" rx="11" ry="16" fill="#C9B6F2" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#F1EAFF" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#4A3F5E" />
      <circle cx="96" cy="84" r="8" fill="#4A3F5E" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="100" rx="9" ry="6" fill="#C98FE0" opacity="0.6" />
      <ellipse cx="114" cy="100" rx="9" ry="6" fill="#C98FE0" opacity="0.6" />
      <path d="M68 102 Q80 114 92 102" fill="none" stroke="#4A3F5E" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function KittenMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <path d="M44 46 L40 10 L74 36 Z" fill="#FFC59E" />
      <path d="M116 46 L120 10 L86 36 Z" fill="#FFC59E" />
      <path d="M48 42 L46 20 L66 35 Z" fill="#FF9F86" />
      <path d="M112 42 L114 20 L94 35 Z" fill="#FF9F86" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#FFC59E" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#FFC59E" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#FFC59E" />
      <ellipse cx="30" cy="106" rx="11" ry="16" fill="#FFC59E" />
      <ellipse cx="130" cy="106" rx="11" ry="16" fill="#FFC59E" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#FFEFE2" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#5A4030" />
      <circle cx="96" cy="84" r="8" fill="#5A4030" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="101" rx="9" ry="6" fill="#FF8F6F" opacity="0.6" />
      <ellipse cx="114" cy="101" rx="9" ry="6" fill="#FF8F6F" opacity="0.6" />
      <path d="M72 100 Q80 108 88 100" fill="none" stroke="#5A4030" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="96" x2="42" y2="100" stroke="#5A4030" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="106" x2="42" y2="106" stroke="#5A4030" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="96" x2="118" y2="100" stroke="#5A4030" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="106" x2="118" y2="106" stroke="#5A4030" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PuppyMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <ellipse cx="32" cy="74" rx="17" ry="32" fill="#7FB8DE" />
      <ellipse cx="128" cy="74" rx="17" ry="32" fill="#7FB8DE" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#9FD0EC" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#9FD0EC" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#9FD0EC" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#E8F4FB" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#3F4A55" />
      <circle cx="96" cy="84" r="8" fill="#3F4A55" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="101" rx="9" ry="6" fill="#FF9DB0" opacity="0.55" />
      <ellipse cx="114" cy="101" rx="9" ry="6" fill="#FF9DB0" opacity="0.55" />
      <ellipse cx="80" cy="99" rx="7" ry="5" fill="#3F4A55" />
      <path d="M70 108 Q80 116 90 108" fill="none" stroke="#3F4A55" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function DragonMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <path d="M48 40 Q55 16 64 38 Z" fill="#62C79C" />
      <path d="M72 32 Q80 6 88 32 Z" fill="#62C79C" />
      <path d="M96 38 Q105 16 112 40 Z" fill="#62C79C" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#8FE0BD" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#8FE0BD" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#8FE0BD" />
      <ellipse cx="30" cy="106" rx="11" ry="16" fill="#8FE0BD" />
      <ellipse cx="130" cy="106" rx="11" ry="16" fill="#8FE0BD" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#E4F7EE" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#2F4A3E" />
      <circle cx="96" cy="84" r="8" fill="#2F4A3E" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="100" rx="9" ry="6" fill="#FF9DB0" opacity="0.55" />
      <ellipse cx="114" cy="100" rx="9" ry="6" fill="#FF9DB0" opacity="0.55" />
      <path d="M68 102 Q80 114 92 102" fill="none" stroke="#2F4A3E" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function ChickMascot(props) {
  return (
    <svg viewBox="0 0 160 170" width="100%" height="100%" {...props}>
      <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)" />
      <path d="M70 32 Q76 12 80 30 Q84 12 90 32 Z" fill="#F5C84A" />
      <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#FFDC73" />
      <ellipse cx="58" cy="156" rx="16" ry="10" fill="#F2A23E" />
      <ellipse cx="102" cy="156" rx="16" ry="10" fill="#F2A23E" />
      <ellipse cx="30" cy="106" rx="11" ry="16" fill="#FFDC73" />
      <ellipse cx="130" cy="106" rx="11" ry="16" fill="#FFDC73" />
      <ellipse cx="80" cy="112" rx="33" ry="37" fill="#FFF3D0" />
      <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff" />
      <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff" />
      <circle cx="64" cy="84" r="8" fill="#4A4023" />
      <circle cx="96" cy="84" r="8" fill="#4A4023" />
      <circle cx="67" cy="81" r="3" fill="#fff" />
      <circle cx="99" cy="81" r="3" fill="#fff" />
      <ellipse cx="46" cy="101" rx="9" ry="6" fill="#FFA86F" opacity="0.6" />
      <ellipse cx="114" cy="101" rx="9" ry="6" fill="#FFA86F" opacity="0.6" />
      <path d="M73 96 L80 106 L87 96 Z" fill="#F2A23E" />
    </svg>
  )
}

/* ---------- מרשם (registry) של הדמויות ---------- */

export const MASCOTS = {
  dino:    { label: 'דינו',   emoji: '🦕', accent: '#C2477E', Component: DinoMascot },
  unicorn: { label: 'חד-קרן', emoji: '🦄', accent: '#8260C0', Component: UnicornMascot },
  kitten:  { label: 'חתול',   emoji: '🐱', accent: '#D98A4E', Component: KittenMascot },
  puppy:   { label: 'כלב',    emoji: '🐶', accent: '#4E8AB5', Component: PuppyMascot },
  dragon:  { label: 'דרקון',  emoji: '🐲', accent: '#3FA277', Component: DragonMascot },
  chick:   { label: 'אפרוח',  emoji: '🐥', accent: '#C99A2E', Component: ChickMascot },
}

export const MASCOT_NAMES = Object.keys(MASCOTS)

/* ---------- רכיב גנרי: דמות בודדת ---------- */

/**
 * <Mascot name="dino" size={120} float />
 *
 * name   — אחד מתוך MASCOT_NAMES (ברירת מחדל: 'dino')
 * size   — קוטר בפיקסלים (ברירת מחדל 120)
 * float  — האם הדמות מרחפת בעדינות
 * style  — סגנון נוסף ל-wrapper
 */
export function Mascot({ name = 'dino', size = 120, float = false, style = {}, ...rest }) {
  const entry = MASCOTS[name] || MASCOTS.dino
  const { Component } = entry
  return (
    <div
      {...rest}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        animation: float ? 'mascot-float 4.2s ease-in-out infinite' : undefined,
        ...style,
      }}
    >
      {float && <FloatStyle />}
      <Component />
    </div>
  )
}

/* ---------- רכיב דמות מנחה: דמות + בועת דיבור ---------- */

/**
 * <MascotGuide name="unicorn" message="כל הכבוד! 🎉" size={110} />
 *
 * דמות מלווה שאומרת משהו — לשיבוץ במסכי התחברות, משחק, סיכום וכו'.
 * message — טקסט בבועה (אם ריק, מוצגת רק הדמות)
 * side    — 'top' (בועה מעל) או 'start' (בועה לצד הדמות). ברירת מחדל 'top'.
 */
export function MascotGuide({ name = 'dino', message = '', size = 110, float = true, side = 'top', style = {} }) {
  const entry = MASCOTS[name] || MASCOTS.dino
  const accent = entry.accent

  const bubble = message ? (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        background: '#fff',
        border: `2.5px solid ${accent}`,
        color: '#444',
        borderRadius: 18,
        padding: '10px 16px',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        boxShadow: '0 6px 18px rgba(0,0,0,.1)',
        maxWidth: 240,
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  ) : null

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: side === 'top' ? 'column' : 'row',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      {bubble}
      <Mascot name={name} size={size} float={float} />
    </div>
  )
}

export default Mascot
