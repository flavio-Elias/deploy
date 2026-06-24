import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authHeaders } from '../utils/auth';
// Panel de administración: permite borrar biometría, banear por zona y activar/desactivar usuarios
export default function AdminUsersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedZoneBan, setSelectedZoneBan] = useState('');
    useEffect(() => {
        fetch('/api/admin/users', { headers: authHeaders() })
            .then(r => r.ok ? r.json() : [])
            .then(setUsers);
        fetch('/api/zones').then(r => r.json()).then(setZones);
    }, []);
    // Pide confirmación y ejecuta una acción administrativa (banear, borrar biometría, activar/desactivar)
    const handleAction = async (endpoint, body) => {
        if (!confirm('¿Estás seguro de realizar esta acción?'))
            return;
        const res = await fetch(`/api/admin/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            alert('No tienes autorización para realizar esta acción');
            return;
        }
        alert('Acción completada con éxito');
        if (endpoint === 'toggle-user') {
            // Recargar usuarios para actualizar el estado is_active
            fetch('/api/admin/users', { headers: authHeaders() })
                .then(r => r.ok ? r.json() : [])
                .then(setUsers);
        }
    };
    return (_jsxs("div", { style: pageStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx("h2", { children: "Gesti\u00F3n de Usuarios" }), _jsx("button", { style: backBtnStyle, onClick: () => navigate('/home'), children: "Volver al Panel" })] }), _jsxs("div", { style: containerStyle, children: [_jsxs("select", { style: selectStyle, onChange: (e) => setSelectedUser(users.find(u => u.id === Number(e.target.value))), defaultValue: "", children: [_jsx("option", { value: "", disabled: true, children: "Seleccione un usuario..." }), users.map(u => (_jsxs("option", { value: u.id, children: [u.name, " ", u.is_active ? '' : '(Desactivado)'] }, u.id)))] }), selectedUser && (_jsxs("div", { style: actionsGrid, children: [_jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "1. Biometr\u00EDa" }), _jsx("p", { children: "Elimina el rostro registrado. El usuario deber\u00E1 escanearse de nuevo." }), _jsx("button", { style: dangerBtnStyle, onClick: () => handleAction('delete-biometrics', { userId: selectedUser.id }), children: "Borrar Rostro" })] }), _jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "2. Revocar Zona (Lista Negra)" }), _jsx("p", { children: "Bloquea el acceso a una zona espec\u00EDfica ignorando su rol." }), _jsxs("select", { style: selectStyle, onChange: e => setSelectedZoneBan(Number(e.target.value)), value: selectedZoneBan, children: [_jsx("option", { value: "", disabled: true, children: "Selecciona la zona..." }), zones.map(z => _jsx("option", { value: z.id, children: z.name }, z.id))] }), _jsxs("div", { style: { display: 'flex', gap: '10px', marginTop: '10px' }, children: [_jsx("button", { style: dangerBtnStyle, onClick: () => selectedZoneBan && handleAction('toggle-ban', { userId: selectedUser.id, zoneId: selectedZoneBan, ban: true }), children: "Banear" }), _jsx("button", { style: safeBtnStyle, onClick: () => selectedZoneBan && handleAction('toggle-ban', { userId: selectedUser.id, zoneId: selectedZoneBan, ban: false }), children: "Quitar Ban" })] })] }), _jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "3. Estado del Usuario" }), _jsx("p", { children: "Desactivar impide cualquier acceso al sistema (Soft Delete)." }), _jsx("button", { style: selectedUser.is_active ? dangerBtnStyle : safeBtnStyle, onClick: () => handleAction('toggle-user', { userId: selectedUser.id, isActive: !selectedUser.is_active }), children: selectedUser.is_active ? 'Desactivar Usuario' : 'Reactivar Usuario' })] })] }))] })] }));
}
// Estilos
const pageStyle = { width: '100vw', height: '100vh', background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column' };
const headerStyle = { padding: '20px 40px', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const containerStyle = { padding: '40px', maxWidth: '900px', margin: '0 auto', width: '100%' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', background: '#374151', color: '#fff', border: 'none', fontSize: '16px' };
const actionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' };
const cardStyle = { background: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151' };
const backBtnStyle = { padding: '8px 16px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const dangerBtnStyle = { padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' };
const safeBtnStyle = { padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' };
