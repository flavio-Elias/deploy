import { useTranslation } from 'react-i18next'

// Botón que alterna el idioma de la interfaz entre español e inglés
export default function LanguageSwitcher({ style }: { style?: React.CSSProperties }) {
  const { i18n } = useTranslation()
  const current = i18n.language

  // Cambia el idioma activo y lo guarda para que persista entre sesiones
  const toggle = () => {
    const next = current === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <button onClick={toggle} style={{ ...btnStyle, ...style }}>
      {current === 'es' ? 'EN' : 'ES'}
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  letterSpacing: '1px',
}
