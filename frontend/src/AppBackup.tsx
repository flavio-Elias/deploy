import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import GoogleLogin from './components/GoogleLogin'
import FaceCamera from './components/FaceCamera'
import AccessLogs from './components/AccessLogs'


interface User {
  email: string
  name: string
  picture: string
}

type ActivePanel = 'choose' | 'login' | 'google' | 'otp' | 'register' | 'logs' | 'userMenu' 
type OtpStep = 'email' | 'code'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>('choose')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')

  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')  
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')

  const [otpStep, setOtpStep] = useState<OtpStep>('email')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpMessage, setOtpMessage] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const openModal = (panel: ActivePanel = 'choose') => {
    setActivePanel(panel)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setActivePanel('choose')
  }

  const goBack = () => setActivePanel('choose')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setLoginMessage('Debes ingresar usuario y contraseña')
      return
    }
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginMessage(data.error || 'Usuario o contraseña incorrectos')
        return
      }
      setUser({ email: data.user.email, name: data.user.name, picture: '' })
      setLoginMessage('')
      closeModal()
    } catch (err) {
      setLoginMessage('Error de conexión con el servidor')
    }
  }

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpEmail) { setOtpMessage('Ingresa tu correo'); return }
    setOtpLoading(true)
    setOtpMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setOtpMessage(data.error ?? 'Error al enviar el código'); return }
      setOtpStep('code')
      setOtpMessage('Código enviado a tu correo')
    } catch {
      setOtpMessage('No se pudo conectar al servidor')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode) { setOtpMessage('Ingresa el código'); return }
    setOtpLoading(true)
    setOtpMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) { setOtpMessage(data.error ?? 'Código incorrecto'); return }
      setUser({ email: data.user.email, name: data.user.name, picture: '' })
      setOtpMessage('')
      closeModal()
    } catch {
      setOtpMessage('No se pudo conectar al servidor')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regUsername || !regEmail || !regPassword || !regPassword2) {
      setRegisterMessage('Debes completar todos los campos')
      return
    }
    if (regPassword !== regPassword2) {
      setRegisterMessage('Las contraseñas no coinciden')
      return
    }

    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: regUsername, 
          email: regEmail,
          password: regPassword 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setRegisterMessage(data.error || 'Error al crear la cuenta')
        return
      }

      setRegisterMessage('¡Cuenta creada! Ya puedes iniciar sesión.')
      setRegUsername('')
      setRegEmail('')
      setRegPassword('')
      setRegPassword2('')
    } catch (err) {
      setRegisterMessage('Error de conexión con el servidor')
    }
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <div style={appStyle}>

        {/* Full-screen camera */}
        <div style={cameraContainerStyle}>
          <FaceCamera />
        </div>

        {/* Top-right bar */}
        <div style={topBarStyle}>
          {user ? (
            <button style={loginBtnStyle} onClick={() => openModal('userMenu')}>
              {user.name}
            </button>
          ) : (
            <button style={loginBtnStyle} onClick={() => openModal()}>
              Login
            </button>
          )}
        </div>

        {/* Modal overlay */}
        {modalOpen && (
          <div style={overlayStyle} onClick={closeModal}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <button style={modalCloseStyle} onClick={closeModal}>✕</button>

              {activePanel === 'choose' && (
                <>
                  <h2 style={modalTitleStyle}>Acceso al sistema</h2>
                  <p style={modalSubtitleStyle}>¿Cómo deseas continuar?</p>
                  <div style={choiceListStyle}>
                    <button
                      style={choiceButtonStyle}
                      onClick={() => setActivePanel('login')}
                    >
                      <span style={choiceIconStyle}></span>
                      Iniciar sesión
                    </button>
                    <button
                      style={choiceButtonStyle}
                      onClick={() => setActivePanel('google')}
                    >
                      <span style={choiceIconStyle}></span>
                      Iniciar con Google
                    </button>
                    <button
                      style={choiceButtonStyle}
                      onClick={() => {
                        setOtpStep('email')
                        setOtpEmail('')
                        setOtpCode('')
                        setOtpMessage('')
                        setActivePanel('otp')
                      }}
                    >
                      <span style={choiceIconStyle}></span>
                      Iniciar con código OTP
                    </button>
                    <button
                      style={choiceButtonStyle}
                      onClick={() => setActivePanel('register')}
                    >
                      <span style={choiceIconStyle}></span>
                      Crear cuenta
                    </button>
                  </div>
                </>
              )}

              {activePanel === 'login' && (
                <>
                  <h2 style={modalTitleStyle}>Iniciar sesión</h2>
                  <form onSubmit={handleLogin} style={formStyle}>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="Nombre de usuario"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                    <div style={{ position: 'relative' }}>
                      <input
                        style={{ ...inputStyle, paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={eyeButtonStyle}
                      >
                      </button>
                    </div>
                    <button type="submit" style={primaryButtonStyle}>
                      Iniciar sesión
                    </button>
                  </form>
                  {loginMessage && <p style={messageStyle}>{loginMessage}</p>}
                  <button style={backButtonStyle} onClick={goBack}>← Volver</button>
                </>
              )}

              {activePanel === 'google' && (
                <>
                  <h2 style={modalTitleStyle}>Iniciar con Google</h2>
                  <p style={modalSubtitleStyle}>Usa tu cuenta de Google para acceder</p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <GoogleLogin onLogin={u => { setUser(u); closeModal() }} />
                  </div>
                  <button style={backButtonStyle} onClick={goBack}>← Volver</button>
                </>
              )}

              {activePanel === 'otp' && (
                <>
                  <h2 style={modalTitleStyle}>Código de un solo uso</h2>
                  {otpStep === 'email' && (
                    <>
                      <p style={modalSubtitleStyle}>Ingresa tu correo y te enviaremos un código</p>
                      <form onSubmit={handleOtpRequest} style={formStyle}>
                        <input
                          style={inputStyle}
                          type="email"
                          placeholder="Correo electrónico"
                          value={otpEmail}
                          onChange={e => setOtpEmail(e.target.value)}
                          disabled={otpLoading}
                        />
                        <button type="submit" style={primaryButtonStyle} disabled={otpLoading}>
                          {otpLoading ? 'Enviando...' : 'Enviar código'}
                        </button>
                      </form>
                    </>
                  )}
                  {otpStep === 'code' && (
                    <>
                      <p style={modalSubtitleStyle}>
                        Código enviado a <b>{otpEmail}</b>
                      </p>
                      <form onSubmit={handleOtpVerify} style={formStyle}>
                        <input
                          style={{ ...inputStyle, textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }}
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          disabled={otpLoading}
                        />
                        <button type="submit" style={primaryButtonStyle} disabled={otpLoading}>
                          {otpLoading ? 'Verificando...' : 'Verificar código'}
                        </button>
                      </form>
                      <button
                        style={backButtonStyle}
                        onClick={() => { setOtpStep('email'); setOtpCode(''); setOtpMessage('') }}
                      >
                        Cambiar correo
                      </button>
                    </>
                  )}
                  {otpMessage && (
                    <p style={otpStep === 'code' && otpMessage.includes('enviado') ? successStyle : messageStyle}>
                      {otpMessage}
                    </p>
                  )}
                  <button style={backButtonStyle} onClick={goBack}>← Volver</button>
                </>
              )}

              {activePanel === 'register' && (
                <>
                  <h2 style={modalTitleStyle}>Crear cuenta</h2>
                  <form onSubmit={handleRegister} style={formStyle}>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="Nombre de usuario"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                    />

                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="Correo electrónico"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                    />

                    <input
                      style={inputStyle}
                      type="password"
                      placeholder="Contraseña"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                    />
                    <input
                      style={inputStyle}
                      type="password"
                      placeholder="Repetir contraseña"
                      value={regPassword2}
                      onChange={e => setRegPassword2(e.target.value)}
                    />
                    <button type="submit" style={primaryButtonStyle}>
                      Crear cuenta
                    </button>
                  </form>
                  {registerMessage && <p style={messageStyle}>{registerMessage}</p>}
                  <button style={backButtonStyle} onClick={goBack}>← Volver</button>
                </>
              )}

              {activePanel === 'userMenu' && (
                <>
                  <h2 style={modalTitleStyle}>Mi Cuenta</h2>
                  <p style={modalSubtitleStyle}>Conectado como {user?.name}</p>
                  
                  <div style={choiceListStyle}>
                    {/* Opción 1: Ver Logs */}
                    <button
                      style={choiceButtonStyle}
                      onClick={() => setActivePanel('logs')}
                    >
                      <span style={choiceIconStyle}></span>
                      Ver historial de accesos
                    </button>

                    {/* Opción 2: Abrir otra sesión */}
                    <button
                      style={choiceButtonStyle}
                      onClick={() => setActivePanel('choose')}
                    >
                      <span style={choiceIconStyle}></span>
                      Abrir otra sesión
                    </button>

                    {/* Opción 3: Cerrar sesión */}
                    <button
                      style={{...choiceButtonStyle, color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca'}}
                      onClick={() => {
                        setUser(null)
                        closeModal()
                      }}
                    >
                      <span style={choiceIconStyle}></span>
                      Cerrar sesión
                    </button>
                  </div>
                  
                  <button style={backButtonStyle} onClick={closeModal}>✕ Cerrar</button>
                </>
              )}

              {activePanel === 'logs' && (
                <AccessLogs onBack={goBack} />
              )}
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  )
}

const appStyle: React.CSSProperties = {
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

const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: 10,
}

const loginBtnStyle: React.CSSProperties = {
  padding: '10px 22px',
  background: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '15px',
  cursor: 'pointer',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
}

const modalStyle: React.CSSProperties = {
  position: 'relative',
  width: '360px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: '18px',
  padding: '32px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const modalCloseStyle: React.CSSProperties = {
  position: 'absolute',
  top: '14px',
  right: '16px',
  background: 'transparent',
  border: 'none',
  fontSize: '18px',
  cursor: 'pointer',
  color: '#6b7280',
}

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 700,
  color: '#111827',
}

const modalSubtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#6b7280',
}

const choiceListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '8px',
}

const choiceButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  color: '#111827',
  fontWeight: 500,
  fontSize: '15px',
  cursor: 'pointer',
  textAlign: 'left',
}

const choiceIconStyle: React.CSSProperties = {
  fontSize: '20px',
  width: '28px',
  textAlign: 'center',
  flexShrink: 0,
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '8px',
}

const inputStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  fontSize: '15px',
  cursor: 'pointer',
}

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  padding: 0,
}

const backButtonStyle: React.CSSProperties = {
  padding: '8px 0',
  border: 'none',
  background: 'transparent',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'left',
}

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#dc2626',
  textAlign: 'center',
}

const successStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#16a34a',
  textAlign: 'center',
}

export default App
