import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authHeaders } from '../utils/auth'

// Panel de administración: permite borrar biometría, banear por zona y activar/desactivar usuarios
export default function AdminUsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedZoneBan, setSelectedZoneBan] = useState<number | ''>('')

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/users', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
    fetch('http://localhost:3000/api/zones').then(r => r.json()).then(setZones)
  }, [])

  // Pide confirmación y ejecuta una acción administrativa (banear, borrar biometría, activar/desactivar)
  const handleAction = async (endpoint: string, body: any) => {
    if (!confirm('¿Estás seguro de realizar esta acción?')) return
    const res = await fetch(`http://localhost:3000/api/admin/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      alert('No tienes autorización para realizar esta acción')
      return
    }
    alert('Acción completada con éxito')
    if (endpoint === 'toggle-user') {
      // Recargar usuarios para actualizar el estado is_active
      fetch('http://localhost:3000/api/admin/users', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(setUsers)
    }
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h2>Gestión de Usuarios</h2>
        <button style={backBtnStyle} onClick={() => navigate('/home')}>Volver al Panel</button>
      </header>

      <div style={containerStyle}>
        <select 
          style={selectStyle} 
          onChange={(e) => setSelectedUser(users.find(u => u.id === Number(e.target.value)))}
          defaultValue=""
        >
          <option value="" disabled>Seleccione un usuario...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} {u.is_active ? '' : '(Desactivado)'}
            </option>
          ))}
        </select>

        {selectedUser && (
          <div style={actionsGrid}>
            <div style={cardStyle}>
              <h3>1. Biometría</h3>
              <p>Elimina el rostro registrado. El usuario deberá escanearse de nuevo.</p>
              <button style={dangerBtnStyle} onClick={() => handleAction('delete-biometrics', { userId: selectedUser.id })}>
                Borrar Rostro
              </button>
            </div>

            <div style={cardStyle}>
              <h3>2. Revocar Zona (Lista Negra)</h3>
              <p>Bloquea el acceso a una zona específica ignorando su rol.</p>
              <select style={selectStyle} onChange={e => setSelectedZoneBan(Number(e.target.value))} value={selectedZoneBan}>
                <option value="" disabled>Selecciona la zona...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button style={dangerBtnStyle} onClick={() => selectedZoneBan && handleAction('toggle-ban', { userId: selectedUser.id, zoneId: selectedZoneBan, ban: true })}>
                  Banear
                </button>
                <button style={safeBtnStyle} onClick={() => selectedZoneBan && handleAction('toggle-ban', { userId: selectedUser.id, zoneId: selectedZoneBan, ban: false })}>
                  Quitar Ban
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3>3. Estado del Usuario</h3>
              <p>Desactivar impide cualquier acceso al sistema (Soft Delete).</p>
              <button 
                style={selectedUser.is_active ? dangerBtnStyle : safeBtnStyle} 
                onClick={() => handleAction('toggle-user', { userId: selectedUser.id, isActive: !selectedUser.is_active })}
              >
                {selectedUser.is_active ? 'Desactivar Usuario' : 'Reactivar Usuario'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Estilos
const pageStyle: React.CSSProperties = { width: '100vw', height: '100vh', background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column' }
const headerStyle: React.CSSProperties = { padding: '20px 40px', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const containerStyle: React.CSSProperties = { padding: '40px', maxWidth: '900px', margin: '0 auto', width: '100%' }
const selectStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', background: '#374151', color: '#fff', border: 'none', fontSize: '16px' }
const actionsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }
const cardStyle: React.CSSProperties = { background: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151' }
const backBtnStyle: React.CSSProperties = { padding: '8px 16px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
const dangerBtnStyle: React.CSSProperties = { padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' }
const safeBtnStyle: React.CSSProperties = { padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' }