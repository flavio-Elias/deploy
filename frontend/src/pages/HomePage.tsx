import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FaceCamera from '../components/FaceCamera'
import QrScanner from '../components/QrScanner'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface Zone { id: number; name: string }

type SubPanel = 'map' | 'options' | 'camera-in' | 'qr-email' | 'qr-scan' | 'inside' | 'options-out' | 'camera-out' | 'qr-scan-out' | 'qr-email-out' |'logs'

// Panel principal: mapa de zonas, validación de entrada/salida y accesos rápidos de administración
export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [subPanel, setSubPanel] = useState<SubPanel>('map')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700) // Detecta el tamaño de la pantalla, para cambiar el grid de zonas a 1 columna en móviles

  const [qrEmail, setQrEmail] = useState('')
  const [qrMessage, setQrMessage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [isMaster, setIsMaster] = useState(false)


  useEffect(() => {
    // Comprobación estricta de credenciales almacenadas
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setIsMaster(JSON.parse(storedUser).master || false)
    }

    fetch('http://localhost:3000/api/zones')
      .then(res => {
        if (!res.ok) throw new Error(t('home.errorLoadingZones'))
        return res.json()
      })
      .then(data => { setZones(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [t])

  // Detecta cambios en el tamaño de la ventana para actualizar el estado isMobile
  useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 700)
  }

  handleResize()
  window.addEventListener('resize', handleResize)

  return () => window.removeEventListener('resize', handleResize)
}, [])

  // Pide al backend que genere y envíe por correo un QR de entrada para la zona seleccionada
  const handleQrRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrEmail) { setQrMessage(t('home.enterEmail')); return }
    setQrLoading(true)
    setQrMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/qr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: qrEmail, zoneId: selectedZone?.id })
      })
      const data = await res.json()
      if (!res.ok) {
        setQrMessage(data.error || t('home.errorSendingQr'))
        setQrLoading(false)
        return
      }
      setQrLoading(false)
      setSubPanel('qr-scan')
    } catch {
      setQrMessage(t('home.connectionError'))
      setQrLoading(false)
    }
  }

  // Pide al backend que genere y envíe por correo un QR de salida para la zona seleccionada
  const handleQrRequestOut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrEmail) { setQrMessage(t('home.enterEmail')); return }
    setQrLoading(true)
    setQrMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/qr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANTE: Aquí mandamos logType: 'Salida'
        body: JSON.stringify({ email: qrEmail, zoneId: selectedZone?.id, logType: 'Salida' }) 
      })
      const data = await res.json()
      if (!res.ok) {
        setQrMessage(data.error || t('home.errorSendingQr'))
        setQrLoading(false)
        return
      }
      setQrLoading(false)
      setSubPanel('qr-scan-out') // Nos lleva al escáner de salida
    } catch {
      setQrMessage(t('home.connectionError'))
      setQrLoading(false)
    }
  }

  // Se llama cuando la cámara o el QR confirman el acceso de entrada a la zona
  const handleAccessGranted = () => {
    setSubPanel('inside')
  }

  // Se llama cuando la cámara o el QR confirman la salida de la zona, y vuelve al mapa
  const handleExitGranted = () => {
    setSelectedZone(null)
    setSubPanel('map')
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('home.adminPanel')}</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Herramientas de visualización restringidas para administradores */}
          {isMaster && subPanel === 'map' && (
            <>
              <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={() => navigate('/history')}>
                {t('accessLogs.title')}
              </button>
              <button style={{ ...primaryButtonStyle, background: '#ef4444' }} onClick={() => navigate('/admin-users')}> 
                {t('home.manageUsers')}
              </button>
              <button style={{ ...primaryButtonStyle, background: '#6366f1' }} onClick={() => navigate('/reports')}> {/*Aqui lo mandamos al componente ReportsPage*/}
                {t('home.viewReports')}
              </button>
            </>
          )}

          <LanguageSwitcher />
          <button style={logoutButtonStyle} onClick={() => {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            navigate('/login')
          }}>{t('home.logout')}</button>
        </div>
      </header>

      <div style={getContentContainerStyle(isMobile)}>

        {subPanel === 'map' && (
          <div style={mapWrapperStyle}>
            <p style={subtitleStyle}>{t('home.selectZone')}</p>
            {loading && <p style={{ color: '#9ca3af' }}>{t('home.loadingMap')}</p>}
            {error && <p style={{ color: '#dc2626' }}>{error}</p>}

            {!loading && !error && (
              <div style={getGridStyle(isMobile)}>
                {zones.map(zone => (
                  <button key={zone.id} style={zoneSquareStyle} onClick={() => { setSelectedZone(zone); setSubPanel('options') }}>
                    <span style={zoneNameStyle}>{zone.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {subPanel === 'options' && selectedZone && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={modalTitleStyle}>{t('home.accessValidation')}</h2>
              <p style={modalSubtitleStyle}>{t('home.entering')} <strong>{selectedZone.name}</strong></p>
              <div style={buttonGroupStyle}>
                <button style={highlightButtonStyle} onClick={() => setSubPanel('camera-in')}>
                  {t('home.facialRecognition')}
                </button>
                <button style={highlightButtonStyle} onClick={() => { setQrEmail(''); setQrMessage(''); setSubPanel('qr-email') }}>
                  {t('home.qrReader')}
                </button>
                <button style={{ ...cancelButtonStyle, marginTop: '12px' }} onClick={() => { setSelectedZone(null); setSubPanel('map') }}>
                  {t('home.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {subPanel === 'camera-in' && selectedZone && (
          <div style={overlayStyle}>
            <div style={{ ...modalStyle, width: 'min(450px, 100%)' }}>
              <h2 style={modalTitleStyle}>{t('home.biometricScan')}</h2>
              <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <FaceCamera zoneId={selectedZone.id} onRecognized={handleAccessGranted} />
              </div>
              <button style={cancelButtonStyle} onClick={() => setSubPanel('options')}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

        {subPanel === 'qr-email' && selectedZone && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={modalTitleStyle}>{t('home.requestQrCode')}</h2>
              <p style={modalSubtitleStyle}>{t('home.enterEmailForQr')} {selectedZone.name}.</p>
              <form onSubmit={handleQrRequest} style={buttonGroupStyle}>
                <input style={inputStyle} type="email" placeholder={t('home.emailPlaceholder')} value={qrEmail} onChange={e => setQrEmail(e.target.value)} disabled={qrLoading} />
                {qrMessage && <p style={messageStyle}>{qrMessage}</p>}
                <button type="submit" style={primaryButtonStyle} disabled={qrLoading}>
                  {qrLoading ? t('home.verifyingAndSending') : t('home.sendQr')}
                </button>
              </form>
              <button style={cancelButtonStyle} onClick={() => setSubPanel('options')} disabled={qrLoading}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

        {subPanel === 'qr-scan' && selectedZone && (
          <div style={overlayStyle}>
            <div style={{ ...modalStyle, width: 'min(450px, 100%)' }}>
              <QrScanner zoneId={selectedZone.id} onSuccess={handleAccessGranted} />
              <button style={{ ...cancelButtonStyle, marginTop: '16px' }} onClick={() => setSubPanel('options')}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

        {subPanel === 'inside' && selectedZone && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }}>{t('home.welcome')}</h1>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '40px' }}>{selectedZone.name.toUpperCase()}</h2>
            <button style={{ ...primaryButtonStyle, padding: '16px 32px', fontSize: '18px', background: '#dc2626' }} onClick={() => setSubPanel('options-out')}>
              {t('home.leaveZone')}
            </button>
          </div>
        )}

        {/* PANEL DE OPCIONES DE SALIDA */}
        {subPanel === 'options-out' && selectedZone && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={modalTitleStyle}>Validación de Salida</h2>
              <p style={modalSubtitleStyle}>Saliendo de: <strong>{selectedZone.name}</strong></p>
              <div style={buttonGroupStyle}>
                <button style={highlightButtonStyle} onClick={() => setSubPanel('camera-out')}>
                  {t('home.facialRecognition')}
                </button>
                <button style={highlightButtonStyle} onClick={() => { setQrEmail(''); setQrMessage(''); setSubPanel('qr-email-out') }}>
                  {t('home.qrReader')}
                </button>
                <button style={{ ...cancelButtonStyle, marginTop: '12px' }} onClick={() => setSubPanel('inside')}>
                  {t('home.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CÁMARA DE SALIDA */}
        {subPanel === 'camera-out' && selectedZone && (
          <div style={overlayStyle}>
            <div style={{...modalStyle, width: 'min(450px, 100%)'}}>
              <h2 style={modalTitleStyle}>Escaneo de Salida</h2>
              <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <FaceCamera zoneId={selectedZone.id} logType="Salida" onRecognized={handleExitGranted} />
              </div>
              <button style={cancelButtonStyle} onClick={() => setSubPanel('options-out')}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

        {/* EMAIL PARA QR DE SALIDA */}
        {subPanel === 'qr-email-out' && selectedZone && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={modalTitleStyle}>Solicitar QR de Salida</h2>
              <p style={modalSubtitleStyle}>{t('home.enterEmailForQr')} {selectedZone.name}.</p>
              <form onSubmit={handleQrRequestOut} style={buttonGroupStyle}>
                <input style={inputStyle} type="email" placeholder={t('home.emailPlaceholder')} value={qrEmail} onChange={e => setQrEmail(e.target.value)} disabled={qrLoading} />
                {qrMessage && <p style={messageStyle}>{qrMessage}</p>}
                <button type="submit" style={primaryButtonStyle} disabled={qrLoading}>
                  {qrLoading ? t('home.verifyingAndSending') : t('home.sendQr')}
                </button>
              </form>
              <button style={cancelButtonStyle} onClick={() => setSubPanel('options-out')} disabled={qrLoading}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

        {/* QR DE SALIDA */}
        {subPanel === 'qr-scan-out' && selectedZone && (
          <div style={overlayStyle}>
            <div style={{...modalStyle, width: 'min(450px, 100%)'}}>
              <QrScanner zoneId={selectedZone.id} logType="Salida" onSuccess={handleExitGranted} />
              <button style={{...cancelButtonStyle, marginTop: '16px'}} onClick={() => setSubPanel('options-out')}>{t('home.goBack')}</button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

// NOTA DE LOOFFARDO.EXE: TENGO QUE VER EL HOMEPAGE PARA HACER RESPONSIVE ESTA ULTIMA PARTE
// Me da miedo tocar parametros si no voy viendo como afectan al display

// Estilos CCS en JS unificados
const pageStyle: React.CSSProperties = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflowX: 'hidden', overflowY: 'auto' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: '24px', fontWeight: 700 }
const logoutButtonStyle: React.CSSProperties = { padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }
const getContentContainerStyle = (isMobile: boolean): React.CSSProperties => {return { flex: 1, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
const mapWrapperStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }
const subtitleStyle: React.CSSProperties = { margin: 0, color: '#9ca3af', fontSize: '16px' }
const getGridStyle = (isMobile: boolean): React.CSSProperties => {return { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: '20px', maxWidth: isMobile ? '360px' : '900px', padding: '20px', boxSizing: 'border-box' }}
const zoneSquareStyle: React.CSSProperties = { width: '100%', height: '140px', background: '#1f2937', border: '2px solid #374151', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' ,padding: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }
const zoneNameStyle: React.CSSProperties = { color: '#fff', fontWeight: 600, fontSize: '14px', textAlign: 'center'}
const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }
const modalStyle: React.CSSProperties = { width: '380px', background: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px', color: '#111827' }
const modalTitleStyle: React.CSSProperties = { margin: 0, fontSize: '22px', fontWeight: 700 }
const modalSubtitleStyle: React.CSSProperties = { margin: 0, fontSize: '14px', color: '#6b7280' }
const buttonGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }
const primaryButtonStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }
const cancelButtonStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#000' }
const messageStyle: React.CSSProperties = { margin: 0, fontSize: '14px', color: '#dc2626', textAlign: 'center', fontWeight: 'bold' }
const highlightButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', borderRadius: '12px', border: '2px solid #2563eb', background: '#eff6ff', color: '#1e3a8a', fontWeight: 700, fontSize: '18px', cursor: 'pointer' }
const panelContainerStyle: React.CSSProperties = { width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', overflowY: 'auto', maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }