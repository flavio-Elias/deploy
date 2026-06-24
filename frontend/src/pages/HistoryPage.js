import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authHeaders } from '../utils/auth';
export default function HistoryPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        fetch('/api/logs', { headers: authHeaders() })
            .then(res => {
            if (!res.ok)
                throw new Error(t('accessLogs.errorLoading'));
            return res.json();
        })
            .then(data => {
            setLogs(data);
            setLoading(false);
        })
            .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, [t]);
    return (_jsxs("main", { style: pageStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx("h1", { style: titleStyle, children: t('accessLogs.title') }), _jsx("button", { style: backButtonStyle, onClick: () => navigate('/home'), children: t('accessLogs.backToMenu') })] }), _jsx("div", { style: contentContainerStyle, children: _jsxs("div", { style: panelContainerStyle, children: [loading && _jsx("p", { children: t('accessLogs.loading') }), error && _jsx("p", { style: { color: 'red' }, children: error }), !loading && !error && (_jsx("div", { style: { width: '100%', overflowX: 'auto' }, children: _jsxs("table", { style: { minWidth: '720px', width: '100%', borderCollapse: 'collapse', textAlign: 'center' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '2px solid #ccc' }, children: [_jsx("th", { style: { padding: '10px' }, children: t('accessLogs.dateTime') }), _jsx("th", { style: { padding: '10px' }, children: t('accessLogs.user') }), _jsx("th", { style: { padding: '10px' }, children: t('accessLogs.zone') }), _jsx("th", { style: { padding: '10px' }, children: t('accessLogs.method') }), _jsx("th", { style: { padding: '10px' }, children: t('accessLogs.type') }), _jsx("th", { style: { padding: '10px' }, children: t('accessLogs.status') })] }) }), _jsx("tbody", { children: logs.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: '20px' }, children: t('accessLogs.noRecords') }) })) : (logs.map(log => (_jsxs("tr", { style: { borderBottom: '1px solid #eee' }, children: [_jsx("td", { style: { padding: '10px' }, children: new Date(log.timestamp).toLocaleString() }), _jsx("td", { style: { padding: '10px' }, children: log.userName }), _jsx("td", { style: { padding: '10px' }, children: log.zoneName }), _jsx("td", { style: { padding: '10px' }, children: log.accessMethod }), _jsx("td", { style: { padding: '10px', fontWeight: 'bold' }, children: log.logType }), _jsx("td", { style: { padding: '10px', color: log.granted ? 'green' : 'red', fontWeight: 'bold' }, children: log.granted ? t('accessLogs.allowed') : t('accessLogs.denied') })] }, log.id)))) })] }) }))] }) })] }));
}
const pageStyle = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' };
const titleStyle = { margin: 0, fontSize: '24px', fontWeight: 700 };
const backButtonStyle = { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
const contentContainerStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const panelContainerStyle = { width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxHeight: '85vh', overflowY: 'auto' };
