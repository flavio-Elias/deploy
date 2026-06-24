import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { authHeaders } from '../utils/auth';
// Panel de reportes: métricas por usuario (horas, zona frecuente) y asistencia por fecha
export default function ReportsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('user');
    // Estados para Usuario
    const [searchUserId, setSearchUserId] = useState('');
    const [userReport, setUserReport] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [emailList, setEmailList] = useState([]);
    // Estados para Fecha
    const [selectedDate, setSelectedDate] = useState('');
    const [dateData, setDateData] = useState(null);
    const [loadingDate, setLoadingDate] = useState(false);
    useEffect(() => {
        fetch('/api/users/emails', { headers: authHeaders() })
            .then(res => res.json())
            .then(data => setEmailList(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);
    // Busca al usuario por correo y trae sus métricas individuales (horas, zona frecuente, etc.)
    const handleFetchUserReport = async (e) => {
        e.preventDefault();
        if (!searchEmail)
            return;
        setLoadingUser(true);
        try {
            const res = await fetch(`/api/reports/user?email=${encodeURIComponent(searchEmail)}`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Error al generar el reporte');
                setLoadingUser(false);
                return;
            }
            setUserReport(data.metrics);
        }
        catch {
            alert(t('home.connectionError'));
        }
        finally {
            setLoadingUser(false);
        }
    };
    // Trae la asistencia y la zona más ocupada para la fecha seleccionada
    const handleFetchDateReport = async (e) => {
        e.preventDefault();
        if (!selectedDate)
            return;
        setLoadingDate(true);
        try {
            const res = await fetch(`/api/reports/date?date=${selectedDate}`, { headers: authHeaders() });
            if (!res.ok)
                throw new Error();
            const data = await res.json();
            setDateData(data);
        }
        catch {
            alert(t('home.connectionError'));
        }
        finally {
            setLoadingDate(false);
        }
    };
    return (_jsxs("main", { style: pageStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx("h1", { style: titleStyle, children: t('home.reportsTitle') }), _jsx("button", { style: logoutButtonStyle, onClick: () => navigate('/home'), children: t('accessLogs.backToMenu') })] }), _jsx("div", { style: contentContainerStyle, children: _jsxs("div", { style: panelContainerStyle, children: [_jsxs("div", { style: tabContainerStyle, children: [_jsx("button", { style: activeTab === 'user' ? activeTabStyle : inactiveTabStyle, onClick: () => setActiveTab('user'), children: "Reporte por Usuario" }), _jsx("button", { style: activeTab === 'date' ? activeTabStyle : inactiveTabStyle, onClick: () => setActiveTab('date'), children: "Reporte por Fecha" })] }), activeTab === 'user' && (_jsxs("div", { children: [_jsxs("form", { onSubmit: handleFetchUserReport, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "email", list: "emails-sugeridos", placeholder: t('home.emailPlaceholder', 'ejemplo@correo.com'), value: searchEmail, onChange: e => setSearchEmail(e.target.value) }), _jsx("datalist", { id: "emails-sugeridos", children: emailList.map(email => _jsx("option", { value: email }, email)) }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: loadingUser ? t('login.sending') : t('home.generateReport') })] }), userReport && (_jsxs("div", { style: { marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: gridKpiStyle, children: [_jsxs("div", { style: kpiCardStyle, children: [_jsx("span", { children: t('home.totalHours') }), _jsxs("strong", { children: [userReport.totalHours, " ", t('home.hours')] })] }), _jsxs("div", { style: kpiCardStyle, children: [_jsx("span", { children: t('home.avgStay') }), _jsxs("strong", { children: [userReport.promedioEstadiaMinutos, " ", t('home.minutes')] })] }), _jsxs("div", { style: kpiCardStyle, children: [_jsx("span", { children: t('home.frequentZone') }), _jsx("strong", { style: { color: '#10b981' }, children: userReport.zonaMasFrecuente })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }, children: [_jsxs("div", { style: chartCardStyle, children: [_jsx("h4", { style: chartTitleStyle, children: t('home.activityByDay') }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: userReport.asistenciaPorDia, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "dia_semana", tick: { fontSize: 12 } }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, { cursor: { fill: '#f3f4f6' } }), _jsx(Bar, { dataKey: "total_asistencias", fill: "#4f46e5", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { style: chartCardStyle, children: [_jsx("h4", { style: chartTitleStyle, children: t('home.hourlyDistribution') }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: userReport.distribucionHoraria, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "hora_del_dia", tick: { fontSize: 12 } }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, { cursor: { fill: '#f3f4f6' } }), _jsx(Bar, { dataKey: "cantidad_ingresos", fill: "#10b981", radius: [4, 4, 0, 0] })] }) })] })] })] }))] })), activeTab === 'date' && (_jsxs("div", { children: [_jsxs("form", { onSubmit: handleFetchDateReport, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "date", value: selectedDate, onChange: e => setSelectedDate(e.target.value) }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: loadingDate ? t('login.sending') : 'Consultar Día' })] }), dateData && (_jsxs("div", { style: { marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { background: '#f3f4f6', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }, children: [_jsx("span", { style: { color: '#4b5563', fontSize: '14px', display: 'block' }, children: "ZONA M\u00C1S TRANSITADA" }), _jsx("strong", { style: { fontSize: '24px', color: '#111827' }, children: dateData.zonaMasOcupada })] }), _jsxs("div", { style: { border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }, children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: '#111827' }, children: "Asistencia Registrada:" }), dateData.asistencia.length === 0 ? (_jsx("p", { style: { color: '#6b7280', margin: 0 }, children: "Nadie registr\u00F3 entrada v\u00E1lida este d\u00EDa." })) : (_jsx("ul", { style: { paddingLeft: '20px', margin: 0, color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }, children: dateData.asistencia.map((name, index) => (_jsx("li", { style: { fontWeight: 500 }, children: name }, index))) }))] })] }))] }))] }) })] }));
}
// Estilos CSS
const pageStyle = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' };
const titleStyle = { margin: 0, fontSize: '24px', fontWeight: 700 };
const logoutButtonStyle = { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
const contentContainerStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const panelContainerStyle = { width: '100%', maxWidth: '850px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' };
const tabContainerStyle = { display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' };
const activeTabStyle = { flex: 1, padding: '12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' };
const inactiveTabStyle = { flex: 1, padding: '12px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' };
const formStyle = { display: 'flex', flexWrap: 'wrap', gap: '12px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#000', flex: '1 1 220px', };
const primaryButtonStyle = { padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' };
const gridKpiStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' };
const kpiCardStyle = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' };
const chartCardStyle = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', background: '#fff', height: '260px' };
const chartTitleStyle = { margin: '0 0 16px 0', fontSize: '14px', color: '#4b5563', textAlign: 'center' };
