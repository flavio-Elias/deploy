import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FaceCamera from '../components/FaceCamera';
import QrScanner from '../components/QrScanner';
import LanguageSwitcher from '../components/LanguageSwitcher';
// Panel principal: mapa de zonas, validación de entrada/salida y accesos rápidos de administración
export default function HomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [subPanel, setSubPanel] = useState('map');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 700); // Detecta el tamaño de la pantalla, para cambiar el grid de zonas a 1 columna en móviles
    const [qrEmail, setQrEmail] = useState('');
    const [qrMessage, setQrMessage] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [isMaster, setIsMaster] = useState(false);
    useEffect(() => {
        // Comprobación estricta de credenciales almacenadas
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setIsMaster(JSON.parse(storedUser).master || false);
        }
        fetch('http://localhost:3000/api/zones')
            .then(res => {
            if (!res.ok)
                throw new Error(t('home.errorLoadingZones'));
            return res.json();
        })
            .then(data => { setZones(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [t]);
    // Detecta cambios en el tamaño de la ventana para actualizar el estado isMobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 700);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // Pide al backend que genere y envíe por correo un QR de entrada para la zona seleccionada
    const handleQrRequest = async (e) => {
        e.preventDefault();
        if (!qrEmail) {
            setQrMessage(t('home.enterEmail'));
            return;
        }
        setQrLoading(true);
        setQrMessage('');
        try {
            const res = await fetch('http://localhost:3000/api/qr/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: qrEmail, zoneId: selectedZone?.id })
            });
            const data = await res.json();
            if (!res.ok) {
                setQrMessage(data.error || t('home.errorSendingQr'));
                setQrLoading(false);
                return;
            }
            setQrLoading(false);
            setSubPanel('qr-scan');
        }
        catch {
            setQrMessage(t('home.connectionError'));
            setQrLoading(false);
        }
    };
    // Pide al backend que genere y envíe por correo un QR de salida para la zona seleccionada
    const handleQrRequestOut = async (e) => {
        e.preventDefault();
        if (!qrEmail) {
            setQrMessage(t('home.enterEmail'));
            return;
        }
        setQrLoading(true);
        setQrMessage('');
        try {
            const res = await fetch('http://localhost:3000/api/qr/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // IMPORTANTE: Aquí mandamos logType: 'Salida'
                body: JSON.stringify({ email: qrEmail, zoneId: selectedZone?.id, logType: 'Salida' })
            });
            const data = await res.json();
            if (!res.ok) {
                setQrMessage(data.error || t('home.errorSendingQr'));
                setQrLoading(false);
                return;
            }
            setQrLoading(false);
            setSubPanel('qr-scan-out'); // Nos lleva al escáner de salida
        }
        catch {
            setQrMessage(t('home.connectionError'));
            setQrLoading(false);
        }
    };
    // Se llama cuando la cámara o el QR confirman el acceso de entrada a la zona
    const handleAccessGranted = () => {
        setSubPanel('inside');
    };
    // Se llama cuando la cámara o el QR confirman la salida de la zona, y vuelve al mapa
    const handleExitGranted = () => {
        setSelectedZone(null);
        setSubPanel('map');
    };
    return (_jsxs("main", { style: pageStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx("h1", { style: titleStyle, children: t('home.adminPanel') }), _jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center' }, children: [isMaster && subPanel === 'map' && (_jsxs(_Fragment, { children: [_jsx("button", { style: { ...primaryButtonStyle, background: '#10b981' }, onClick: () => navigate('/history'), children: t('accessLogs.title') }), _jsx("button", { style: { ...primaryButtonStyle, background: '#ef4444' }, onClick: () => navigate('/admin-users'), children: t('home.manageUsers') }), _jsxs("button", { style: { ...primaryButtonStyle, background: '#6366f1' }, onClick: () => navigate('/reports'), children: [" ", t('home.viewReports')] })] })), _jsx(LanguageSwitcher, {}), _jsx("button", { style: logoutButtonStyle, onClick: () => {
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('token');
                                    navigate('/login');
                                }, children: t('home.logout') })] })] }), _jsxs("div", { style: getContentContainerStyle(isMobile), children: [subPanel === 'map' && (_jsxs("div", { style: mapWrapperStyle, children: [_jsx("p", { style: subtitleStyle, children: t('home.selectZone') }), loading && _jsx("p", { style: { color: '#9ca3af' }, children: t('home.loadingMap') }), error && _jsx("p", { style: { color: '#dc2626' }, children: error }), !loading && !error && (_jsx("div", { style: getGridStyle(isMobile), children: zones.map(zone => (_jsx("button", { style: zoneSquareStyle, onClick: () => { setSelectedZone(zone); setSubPanel('options'); }, children: _jsx("span", { style: zoneNameStyle, children: zone.name }) }, zone.id))) }))] })), subPanel === 'options' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: modalStyle, children: [_jsx("h2", { style: modalTitleStyle, children: t('home.accessValidation') }), _jsxs("p", { style: modalSubtitleStyle, children: [t('home.entering'), " ", _jsx("strong", { children: selectedZone.name })] }), _jsxs("div", { style: buttonGroupStyle, children: [_jsx("button", { style: highlightButtonStyle, onClick: () => setSubPanel('camera-in'), children: t('home.facialRecognition') }), _jsx("button", { style: highlightButtonStyle, onClick: () => { setQrEmail(''); setQrMessage(''); setSubPanel('qr-email'); }, children: t('home.qrReader') }), _jsx("button", { style: { ...cancelButtonStyle, marginTop: '12px' }, onClick: () => { setSelectedZone(null); setSubPanel('map'); }, children: t('home.cancel') })] })] }) })), subPanel === 'camera-in' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: { ...modalStyle, width: 'min(450px, 100%)' }, children: [_jsx("h2", { style: modalTitleStyle, children: t('home.biometricScan') }), _jsx("div", { style: { width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }, children: _jsx(FaceCamera, { zoneId: selectedZone.id, onRecognized: handleAccessGranted }) }), _jsx("button", { style: cancelButtonStyle, onClick: () => setSubPanel('options'), children: t('home.goBack') })] }) })), subPanel === 'qr-email' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: modalStyle, children: [_jsx("h2", { style: modalTitleStyle, children: t('home.requestQrCode') }), _jsxs("p", { style: modalSubtitleStyle, children: [t('home.enterEmailForQr'), " ", selectedZone.name, "."] }), _jsxs("form", { onSubmit: handleQrRequest, style: buttonGroupStyle, children: [_jsx("input", { style: inputStyle, type: "email", placeholder: t('home.emailPlaceholder'), value: qrEmail, onChange: e => setQrEmail(e.target.value), disabled: qrLoading }), qrMessage && _jsx("p", { style: messageStyle, children: qrMessage }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: qrLoading, children: qrLoading ? t('home.verifyingAndSending') : t('home.sendQr') })] }), _jsx("button", { style: cancelButtonStyle, onClick: () => setSubPanel('options'), disabled: qrLoading, children: t('home.goBack') })] }) })), subPanel === 'qr-scan' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: { ...modalStyle, width: 'min(450px, 100%)' }, children: [_jsx(QrScanner, { zoneId: selectedZone.id, onSuccess: handleAccessGranted }), _jsx("button", { style: { ...cancelButtonStyle, marginTop: '16px' }, onClick: () => setSubPanel('options'), children: t('home.goBack') })] }) })), subPanel === 'inside' && selectedZone && (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("h1", { style: { fontSize: '48px', color: '#10b981', marginBottom: '20px' }, children: t('home.welcome') }), _jsx("h2", { style: { fontSize: '36px', fontWeight: 'bold', marginBottom: '40px' }, children: selectedZone.name.toUpperCase() }), _jsx("button", { style: { ...primaryButtonStyle, padding: '16px 32px', fontSize: '18px', background: '#dc2626' }, onClick: () => setSubPanel('options-out'), children: t('home.leaveZone') })] })), subPanel === 'options-out' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: modalStyle, children: [_jsx("h2", { style: modalTitleStyle, children: "Validaci\u00F3n de Salida" }), _jsxs("p", { style: modalSubtitleStyle, children: ["Saliendo de: ", _jsx("strong", { children: selectedZone.name })] }), _jsxs("div", { style: buttonGroupStyle, children: [_jsx("button", { style: highlightButtonStyle, onClick: () => setSubPanel('camera-out'), children: t('home.facialRecognition') }), _jsx("button", { style: highlightButtonStyle, onClick: () => { setQrEmail(''); setQrMessage(''); setSubPanel('qr-email-out'); }, children: t('home.qrReader') }), _jsx("button", { style: { ...cancelButtonStyle, marginTop: '12px' }, onClick: () => setSubPanel('inside'), children: t('home.cancel') })] })] }) })), subPanel === 'camera-out' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: { ...modalStyle, width: 'min(450px, 100%)' }, children: [_jsx("h2", { style: modalTitleStyle, children: "Escaneo de Salida" }), _jsx("div", { style: { width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }, children: _jsx(FaceCamera, { zoneId: selectedZone.id, logType: "Salida", onRecognized: handleExitGranted }) }), _jsx("button", { style: cancelButtonStyle, onClick: () => setSubPanel('options-out'), children: t('home.goBack') })] }) })), subPanel === 'qr-email-out' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: modalStyle, children: [_jsx("h2", { style: modalTitleStyle, children: "Solicitar QR de Salida" }), _jsxs("p", { style: modalSubtitleStyle, children: [t('home.enterEmailForQr'), " ", selectedZone.name, "."] }), _jsxs("form", { onSubmit: handleQrRequestOut, style: buttonGroupStyle, children: [_jsx("input", { style: inputStyle, type: "email", placeholder: t('home.emailPlaceholder'), value: qrEmail, onChange: e => setQrEmail(e.target.value), disabled: qrLoading }), qrMessage && _jsx("p", { style: messageStyle, children: qrMessage }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: qrLoading, children: qrLoading ? t('home.verifyingAndSending') : t('home.sendQr') })] }), _jsx("button", { style: cancelButtonStyle, onClick: () => setSubPanel('options-out'), disabled: qrLoading, children: t('home.goBack') })] }) })), subPanel === 'qr-scan-out' && selectedZone && (_jsx("div", { style: overlayStyle, children: _jsxs("div", { style: { ...modalStyle, width: 'min(450px, 100%)' }, children: [_jsx(QrScanner, { zoneId: selectedZone.id, logType: "Salida", onSuccess: handleExitGranted }), _jsx("button", { style: { ...cancelButtonStyle, marginTop: '16px' }, onClick: () => setSubPanel('options-out'), children: t('home.goBack') })] }) }))] })] }));
}
// NOTA DE LOOFFARDO.EXE: TENGO QUE VER EL HOMEPAGE PARA HACER RESPONSIVE ESTA ULTIMA PARTE
// Me da miedo tocar parametros si no voy viendo como afectan al display
// Estilos CCS en JS unificados
const pageStyle = { width: '100vw', height: '100vh', background: '#111827', display: 'flex', flexDirection: 'column', color: '#fff', overflowX: 'hidden', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)' };
const titleStyle = { margin: 0, fontSize: '24px', fontWeight: 700 };
const logoutButtonStyle = { padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
const getContentContainerStyle = (isMobile) => { return { flex: 1, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }; };
const mapWrapperStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
const subtitleStyle = { margin: 0, color: '#9ca3af', fontSize: '16px' };
const getGridStyle = (isMobile) => { return { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: '20px', maxWidth: isMobile ? '360px' : '900px', padding: '20px', boxSizing: 'border-box' }; };
const zoneSquareStyle = { width: '100%', height: '140px', background: '#1f2937', border: '2px solid #374151', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' };
const zoneNameStyle = { color: '#fff', fontWeight: 600, fontSize: '14px', textAlign: 'center' };
const overlayStyle = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 };
const modalStyle = { width: '380px', background: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px', color: '#111827' };
const modalTitleStyle = { margin: 0, fontSize: '22px', fontWeight: 700 };
const modalSubtitleStyle = { margin: 0, fontSize: '14px', color: '#6b7280' };
const buttonGroupStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' };
const primaryButtonStyle = { padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' };
const cancelButtonStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontWeight: 600, cursor: 'pointer', textAlign: 'center' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#000' };
const messageStyle = { margin: 0, fontSize: '14px', color: '#dc2626', textAlign: 'center', fontWeight: 'bold' };
const highlightButtonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', borderRadius: '12px', border: '2px solid #2563eb', background: '#eff6ff', color: '#1e3a8a', fontWeight: 700, fontSize: '18px', cursor: 'pointer' };
const panelContainerStyle = { width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: '12px', padding: '32px', color: '#000', overflowY: 'auto', maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' };
