import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FaceCamera from '../components/FaceCamera'
import LanguageSwitcher from '../components/LanguageSwitcher'

// Pantalla principal con la cámara para reconocimiento facial (login y kiosko de acceso)
export default function CameraPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  // Guarda al usuario reconocido por la cámara y lo lleva al panel principal
  const handleFaceLogin = (user: any) => {
    localStorage.setItem('user', JSON.stringify(user))
    navigate('/home')
  }

  return (
    <main style={pageStyle}>
      <div style={cameraContainerStyle}>
        <FaceCamera onRecognized={handleFaceLogin} />
        <FaceCamera />
      </div>

      <div style={topRightStyle}>
        <LanguageSwitcher />
        <button style={loginButtonStyle} onClick={() => navigate('/login')}>
          {t('camera.login')}
        </button>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  position: 'relative',
  background: '#000',
  overflow: 'hidden',
}

const cameraContainerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
}

const topRightStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: 10,
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
}

const loginButtonStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  backdropFilter: 'blur(10px)',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
}
