import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLogin from './components/GoogleLogin';
import FaceCamera from './components/FaceCamera';
import AccessLogs from './components/AccessLogs';
function App() {
    const [user, setUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activePanel, setActivePanel] = useState('choose');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginMessage, setLoginMessage] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPassword2, setRegPassword2] = useState('');
    const [registerMessage, setRegisterMessage] = useState('');
    const [otpStep, setOtpStep] = useState('email');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpMessage, setOtpMessage] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const openModal = (panel = 'choose') => {
        setActivePanel(panel);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setActivePanel('choose');
    };
    const goBack = () => setActivePanel('choose');
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setLoginMessage('Debes ingresar usuario y contraseña');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, password: password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginMessage(data.error || 'Usuario o contraseña incorrectos');
                return;
            }
            setUser({ email: data.user.email, name: data.user.name, picture: '' });
            setLoginMessage('');
            closeModal();
        }
        catch (err) {
            setLoginMessage('Error de conexión con el servidor');
        }
    };
    const handleOtpRequest = async (e) => {
        e.preventDefault();
        if (!otpEmail) {
            setOtpMessage('Ingresa tu correo');
            return;
        }
        setOtpLoading(true);
        setOtpMessage('');
        try {
            const res = await fetch('http://localhost:3000/api/auth/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpMessage(data.error ?? 'Error al enviar el código');
                return;
            }
            setOtpStep('code');
            setOtpMessage('Código enviado a tu correo');
        }
        catch {
            setOtpMessage('No se pudo conectar al servidor');
        }
        finally {
            setOtpLoading(false);
        }
    };
    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otpCode) {
            setOtpMessage('Ingresa el código');
            return;
        }
        setOtpLoading(true);
        setOtpMessage('');
        try {
            const res = await fetch('http://localhost:3000/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail, code: otpCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpMessage(data.error ?? 'Código incorrecto');
                return;
            }
            setUser({ email: data.user.email, name: data.user.name, picture: '' });
            setOtpMessage('');
            closeModal();
        }
        catch {
            setOtpMessage('No se pudo conectar al servidor');
        }
        finally {
            setOtpLoading(false);
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!regUsername || !regEmail || !regPassword || !regPassword2) {
            setRegisterMessage('Debes completar todos los campos');
            return;
        }
        if (regPassword !== regPassword2) {
            setRegisterMessage('Las contraseñas no coinciden');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: regUsername,
                    email: regEmail,
                    password: regPassword
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setRegisterMessage(data.error || 'Error al crear la cuenta');
                return;
            }
            setRegisterMessage('¡Cuenta creada! Ya puedes iniciar sesión.');
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            setRegPassword2('');
        }
        catch (err) {
            setRegisterMessage('Error de conexión con el servidor');
        }
    };
    return (_jsx(GoogleOAuthProvider, { clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', children: _jsxs("div", { style: appStyle, children: [_jsx("div", { style: cameraContainerStyle, children: _jsx(FaceCamera, {}) }), _jsx("div", { style: topBarStyle, children: user ? (_jsx("button", { style: loginBtnStyle, onClick: () => openModal('userMenu'), children: user.name })) : (_jsx("button", { style: loginBtnStyle, onClick: () => openModal(), children: "Login" })) }), modalOpen && (_jsx("div", { style: overlayStyle, onClick: closeModal, children: _jsxs("div", { style: modalStyle, onClick: e => e.stopPropagation(), children: [_jsx("button", { style: modalCloseStyle, onClick: closeModal, children: "\u2715" }), activePanel === 'choose' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "Acceso al sistema" }), _jsx("p", { style: modalSubtitleStyle, children: "\u00BFC\u00F3mo deseas continuar?" }), _jsxs("div", { style: choiceListStyle, children: [_jsxs("button", { style: choiceButtonStyle, onClick: () => setActivePanel('login'), children: [_jsx("span", { style: choiceIconStyle }), "Iniciar sesi\u00F3n"] }), _jsxs("button", { style: choiceButtonStyle, onClick: () => setActivePanel('google'), children: [_jsx("span", { style: choiceIconStyle }), "Iniciar con Google"] }), _jsxs("button", { style: choiceButtonStyle, onClick: () => {
                                                    setOtpStep('email');
                                                    setOtpEmail('');
                                                    setOtpCode('');
                                                    setOtpMessage('');
                                                    setActivePanel('otp');
                                                }, children: [_jsx("span", { style: choiceIconStyle }), "Iniciar con c\u00F3digo OTP"] }), _jsxs("button", { style: choiceButtonStyle, onClick: () => setActivePanel('register'), children: [_jsx("span", { style: choiceIconStyle }), "Crear cuenta"] })] })] })), activePanel === 'login' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "Iniciar sesi\u00F3n" }), _jsxs("form", { onSubmit: handleLogin, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "text", placeholder: "Nombre de usuario", value: username, onChange: e => setUsername(e.target.value) }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { style: { ...inputStyle, paddingRight: '40px', width: '100%', boxSizing: 'border-box' }, type: showPassword ? 'text' : 'password', placeholder: "Contrase\u00F1a", value: password, onChange: e => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: eyeButtonStyle })] }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: "Iniciar sesi\u00F3n" })] }), loginMessage && _jsx("p", { style: messageStyle, children: loginMessage }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: "\u2190 Volver" })] })), activePanel === 'google' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "Iniciar con Google" }), _jsx("p", { style: modalSubtitleStyle, children: "Usa tu cuenta de Google para acceder" }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', marginTop: '20px' }, children: _jsx(GoogleLogin, { onLogin: u => { setUser(u); closeModal(); } }) }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: "\u2190 Volver" })] })), activePanel === 'otp' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "C\u00F3digo de un solo uso" }), otpStep === 'email' && (_jsxs(_Fragment, { children: [_jsx("p", { style: modalSubtitleStyle, children: "Ingresa tu correo y te enviaremos un c\u00F3digo" }), _jsxs("form", { onSubmit: handleOtpRequest, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "email", placeholder: "Correo electr\u00F3nico", value: otpEmail, onChange: e => setOtpEmail(e.target.value), disabled: otpLoading }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: otpLoading, children: otpLoading ? 'Enviando...' : 'Enviar código' })] })] })), otpStep === 'code' && (_jsxs(_Fragment, { children: [_jsxs("p", { style: modalSubtitleStyle, children: ["C\u00F3digo enviado a ", _jsx("b", { children: otpEmail })] }), _jsxs("form", { onSubmit: handleOtpVerify, style: formStyle, children: [_jsx("input", { style: { ...inputStyle, textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }, type: "text", placeholder: "000000", maxLength: 6, value: otpCode, onChange: e => setOtpCode(e.target.value.replace(/\D/g, '')), disabled: otpLoading }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: otpLoading, children: otpLoading ? 'Verificando...' : 'Verificar código' })] }), _jsx("button", { style: backButtonStyle, onClick: () => { setOtpStep('email'); setOtpCode(''); setOtpMessage(''); }, children: "Cambiar correo" })] })), otpMessage && (_jsx("p", { style: otpStep === 'code' && otpMessage.includes('enviado') ? successStyle : messageStyle, children: otpMessage })), _jsx("button", { style: backButtonStyle, onClick: goBack, children: "\u2190 Volver" })] })), activePanel === 'register' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "Crear cuenta" }), _jsxs("form", { onSubmit: handleRegister, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "text", placeholder: "Nombre de usuario", value: regUsername, onChange: e => setRegUsername(e.target.value) }), _jsx("input", { style: inputStyle, type: "email", placeholder: "Correo electr\u00F3nico", value: regEmail, onChange: e => setRegEmail(e.target.value) }), _jsx("input", { style: inputStyle, type: "password", placeholder: "Contrase\u00F1a", value: regPassword, onChange: e => setRegPassword(e.target.value) }), _jsx("input", { style: inputStyle, type: "password", placeholder: "Repetir contrase\u00F1a", value: regPassword2, onChange: e => setRegPassword2(e.target.value) }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: "Crear cuenta" })] }), registerMessage && _jsx("p", { style: messageStyle, children: registerMessage }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: "\u2190 Volver" })] })), activePanel === 'userMenu' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: modalTitleStyle, children: "Mi Cuenta" }), _jsxs("p", { style: modalSubtitleStyle, children: ["Conectado como ", user?.name] }), _jsxs("div", { style: choiceListStyle, children: [_jsxs("button", { style: choiceButtonStyle, onClick: () => setActivePanel('logs'), children: [_jsx("span", { style: choiceIconStyle }), "Ver historial de accesos"] }), _jsxs("button", { style: choiceButtonStyle, onClick: () => setActivePanel('choose'), children: [_jsx("span", { style: choiceIconStyle }), "Abrir otra sesi\u00F3n"] }), _jsxs("button", { style: { ...choiceButtonStyle, color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }, onClick: () => {
                                                    setUser(null);
                                                    closeModal();
                                                }, children: [_jsx("span", { style: choiceIconStyle }), "Cerrar sesi\u00F3n"] })] }), _jsx("button", { style: backButtonStyle, onClick: closeModal, children: "\u2715 Cerrar" })] })), activePanel === 'logs' && (_jsx(AccessLogs, { onBack: goBack }))] }) }))] }) }));
}
const appStyle = {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    background: '#000',
    overflow: 'hidden',
};
const cameraContainerStyle = {
    position: 'absolute',
    inset: 0,
};
const topBarStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 10,
};
const loginBtnStyle = {
    padding: '10px 22px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
};
const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
};
const modalStyle = {
    position: 'relative',
    width: '360px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '18px',
    padding: '32px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};
const modalCloseStyle = {
    position: 'absolute',
    top: '14px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
};
const modalTitleStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
};
const modalSubtitleStyle = {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
};
const choiceListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
};
const choiceButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    color: '#111827',
    fontWeight: 500,
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'left',
};
const choiceIconStyle = {
    fontSize: '20px',
    width: '28px',
    textAlign: 'center',
    flexShrink: 0,
};
const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
};
const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
};
const primaryButtonStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
};
const eyeButtonStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
};
const backButtonStyle = {
    padding: '8px 0',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
};
const messageStyle = {
    margin: 0,
    fontSize: '13px',
    color: '#dc2626',
    textAlign: 'center',
};
const successStyle = {
    margin: 0,
    fontSize: '13px',
    color: '#16a34a',
    textAlign: 'center',
};
export default App;
