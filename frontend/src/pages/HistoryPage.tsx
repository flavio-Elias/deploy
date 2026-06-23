import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authHeaders } from '../utils/auth'

type AccessLog = {
  id: number;
  userName: string;
  zoneName: string;
  accessMethod: "CARA" | "QR";
  logType: "Entrada" | "Salida";
  granted: boolean;
  timestamp: string;
}

export default function HistoryPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [logs, setLogs] = useState<AccessLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('http://localhost:3000/api/logs', { headers: authHeaders() })
            .then(res => {
                if (!res.ok) throw new Error(t('accessLogs.errorLoading'))
                return res.json()
            })
            .then(data => {
                setLogs(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [t])

    return (
        <main style={pageStyle}>
            <header style={headerStyle}>
                <h1 style={titleStyle}>{t('accessLogs.title')}</h1>
                <button style={backButtonStyle} onClick={() => navigate('/home')}>
                    {t('accessLogs.backToMenu')}
                </button>
            </header>

            <div style={contentContainerStyle}>
                <div style={panelContainerStyle}>
                    {loading && <p>{t('accessLogs.loading')}</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {!loading && !error && (
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <table style={{ minWidth: '720px', width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ccc' }}>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.dateTime')}</th>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.user')}</th>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.zone')}</th>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.method')}</th>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.type')}</th>
                                        <th style={{ padding: '10px' }}>{t('accessLogs.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: '20px' }}>{t('accessLogs.noRecords')}</td></tr>
                                    ) : (
                                        logs.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '10px' }}>{log.userName}</td>
                                                <td style={{ padding: '10px' }}>{log.zoneName}</td>
                                                <td style={{ padding: '10px' }}>{log.accessMethod}</td>
                                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.logType}</td>
                                                <td style={{ padding: '10px', color: log.granted ? 'green' : 'red', fontWeight: 'bold' }}>
                                                    {log.granted ? t('accessLogs.allowed') : t('accessLogs.denied')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

const pageStyle: React.CSSProperties = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: '24px', fontWeight: 700 }
const backButtonStyle: React.CSSProperties = { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }
const contentContainerStyle: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
const panelContainerStyle: React.CSSProperties = { width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxHeight: '85vh', overflowY: 'auto' }