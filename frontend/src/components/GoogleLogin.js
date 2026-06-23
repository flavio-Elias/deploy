import { jsx as _jsx } from "react/jsx-runtime";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
// Botón de Google Login: verifica el token contra el backend y entrega el usuario (con rol/master) y el JWT de sesión
function GoogleLoginComponent({ onLogin }) {
    // Decodifica el ID token de Google y lo valida contra el backend antes de iniciar sesión
    const handleSuccess = async (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        try {
            const res = await fetch('http://localhost:3000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });
            if (!res.ok) {
                console.error('Backend rechazó el token de Google');
                return;
            }
            const data = await res.json();
            localStorage.setItem('googleToken', credentialResponse.credential);
            localStorage.setItem('token', data.token);
            onLogin({ ...data.user, picture: decoded.picture });
        }
        catch {
            console.error('No se pudo conectar al backend para verificar Google SSO');
        }
    };
    // Se ejecuta si el widget de Google falla al autenticar
    const handleError = () => {
        console.error('Error en la autenticacion');
    };
    return _jsx(GoogleLogin, { onSuccess: handleSuccess, onError: handleError });
}
export default GoogleLoginComponent;
