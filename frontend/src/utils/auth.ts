// Devuelve el header Authorization con el JWT guardado en localStorage, o vacío si no hay sesión
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
