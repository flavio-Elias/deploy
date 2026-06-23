import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
    email: string
    name: string
    picture: string
}

interface BackendUser {
    id: number
    name: string
    email: string
    roleId: number | null
    master: boolean
    picture: string
}

// Botón de Google Login: verifica el token contra el backend y entrega el usuario (con rol/master) y el JWT de sesión
function GoogleLoginComponent({ onLogin }: { onLogin: (user: BackendUser) => void }) {
    // Decodifica el ID token de Google y lo valida contra el backend antes de iniciar sesión
    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        const decoded = jwtDecode<DecodedToken>(credentialResponse.credential!)

        try {
            const res = await fetch('http://localhost:3000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            })
            if (!res.ok) {
                console.error('Backend rechazó el token de Google')
                return
            }
            const data = await res.json()
            localStorage.setItem('googleToken', credentialResponse.credential!)
            localStorage.setItem('token', data.token)
            onLogin({ ...data.user, picture: decoded.picture })
        } catch {
            console.error('No se pudo conectar al backend para verificar Google SSO')
        }
    }

    // Se ejecuta si el widget de Google falla al autenticar
    const handleError = () => {
        console.error('Error en la autenticacion')
    }

    return <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
}

export default GoogleLoginComponent
