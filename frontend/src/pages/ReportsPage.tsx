import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { authHeaders } from '../utils/auth'

type ReportTab = 'user' | 'date'

// Panel de reportes: métricas por usuario (horas, zona frecuente) y asistencia por fecha
export default function ReportsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const [activeTab, setActiveTab] = useState<ReportTab>('user')

  // Estados para Usuario
  const [searchUserId, setSearchUserId] = useState('')
  const [userReport, setUserReport] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])

  // Estados para Fecha
  const [selectedDate, setSelectedDate] = useState('')
  const [dateData, setDateData] = useState<any>(null)
  const [loadingDate, setLoadingDate] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3000/api/users/emails', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setEmailList(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Busca al usuario por correo y trae sus métricas individuales (horas, zona frecuente, etc.)
  const handleFetchUserReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchEmail) return
    setLoadingUser(true)
    
    try {
      const res = await fetch(`http://localhost:3000/api/reports/user?email=${encodeURIComponent(searchEmail)}`, { headers: authHeaders() })
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || 'Error al generar el reporte') 
        setLoadingUser(false)
        return
      }
      
      setUserReport(data.metrics)
    } catch {
      alert(t('home.connectionError'))
    } finally {
      setLoadingUser(false)
    }
  }

  // Trae la asistencia y la zona más ocupada para la fecha seleccionada
  const handleFetchDateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return
    setLoadingDate(true)
    try {
      const res = await fetch(`http://localhost:3000/api/reports/date?date=${selectedDate}`, { headers: authHeaders() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDateData(data)
    } catch {
      alert(t('home.connectionError'))
    } finally {
      setLoadingDate(false)
    }
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('home.reportsTitle')}</h1>
        <button style={logoutButtonStyle} onClick={() => navigate('/home')}>
          {t('accessLogs.backToMenu')}
        </button>
      </header>

      <div style={contentContainerStyle}>
        <div style={panelContainerStyle}>
          
          {/* Navegación de pestañas */}
          <div style={tabContainerStyle}>
            <button 
              style={activeTab === 'user' ? activeTabStyle : inactiveTabStyle} 
              onClick={() => setActiveTab('user')}
            >
              Reporte por Usuario
            </button>
            <button 
              style={activeTab === 'date' ? activeTabStyle : inactiveTabStyle} 
              onClick={() => setActiveTab('date')}
            >
              Reporte por Fecha
            </button>
          </div>

          {/* TAB: USUARIO */}
          {activeTab === 'user' && (
            <div>
            <form onSubmit={handleFetchUserReport} style={formStyle}>
                <input 
                  style={inputStyle} 
                  type="email" 
                  list="emails-sugeridos" 
                  placeholder={t('home.emailPlaceholder', 'ejemplo@correo.com')} 
                  value={searchEmail} 
                  onChange={e => setSearchEmail(e.target.value)} 
                />
                <datalist id="emails-sugeridos">
                  {emailList.map(email => <option key={email} value={email} />)}
                </datalist>
                
                <button type="submit" style={primaryButtonStyle}>
                  {loadingUser ? t('login.sending') : t('home.generateReport')}
                </button>
              </form>

              {userReport && (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={gridKpiStyle}>
                    <div style={kpiCardStyle}>
                      <span>{t('home.totalHours')}</span>
                      <strong>{userReport.totalHours} {t('home.hours')}</strong>
                    </div>
                    <div style={kpiCardStyle}>
                      <span>{t('home.avgStay')}</span>
                      <strong>{userReport.promedioEstadiaMinutos} {t('home.minutes')}</strong>
                    </div>
                    <div style={kpiCardStyle}>
                      <span>{t('home.frequentZone')}</span>
                      <strong style={{ color: '#10b981' }}>{userReport.zonaMasFrecuente}</strong>
                    </div>
                  </div>

                  {/* Gráficos con Recharts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px'}}>
                    <div style={chartCardStyle}>
                      <h4 style={chartTitleStyle}>{t('home.activityByDay')}</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userReport.asistenciaPorDia}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="dia_semana" tick={{fontSize: 12}} />
                          <YAxis allowDecimals={false} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="total_asistencias" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={chartCardStyle}>
                      <h4 style={chartTitleStyle}>{t('home.hourlyDistribution')}</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userReport.distribucionHoraria}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="hora_del_dia" tick={{fontSize: 12}} />
                          <YAxis allowDecimals={false} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="cantidad_ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FECHA */}
          {activeTab === 'date' && (
            <div>
              <form onSubmit={handleFetchDateReport} style={formStyle}>
                <input 
                  style={inputStyle} 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                />
                <button type="submit" style={primaryButtonStyle}>
                  {loadingDate ? t('login.sending') : 'Consultar Día'}
                </button>
              </form>

              {dateData && (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <span style={{ color: '#4b5563', fontSize: '14px', display: 'block' }}>ZONA MÁS TRANSITADA</span>
                    <strong style={{ fontSize: '24px', color: '#111827' }}>{dateData.zonaMasOcupada}</strong>
                  </div>

                  <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#111827' }}>Asistencia Registrada:</h4>
                    {dateData.asistencia.length === 0 ? (
                      <p style={{ color: '#6b7280', margin: 0 }}>Nadie registró entrada válida este día.</p>
                    ) : (
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {dateData.asistencia.map((name: string, index: number) => (
                          <li key={index} style={{ fontWeight: 500 }}>{name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

// Estilos CSS
const pageStyle: React.CSSProperties = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: '24px', fontWeight: 700 }
const logoutButtonStyle: React.CSSProperties = { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }
const contentContainerStyle: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
const panelContainerStyle: React.CSSProperties = { width: '100%', maxWidth: '850px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }

const tabContainerStyle: React.CSSProperties = { display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }
const activeTabStyle: React.CSSProperties = { flex: 1, padding: '12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }
const inactiveTabStyle: React.CSSProperties = { flex: 1, padding: '12px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }

const formStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '12px' }
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#000', flex: '1 1 220px',}
const primaryButtonStyle: React.CSSProperties = { padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }

const gridKpiStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }
const kpiCardStyle: React.CSSProperties = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }

const chartCardStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', background: '#fff', height: '260px' }
const chartTitleStyle: React.CSSProperties = { margin: '0 0 16px 0', fontSize: '14px', color: '#4b5563', textAlign: 'center' }