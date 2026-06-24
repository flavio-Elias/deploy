import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLogin from '../components/GoogleLogin';
import FaceCamera from '../components/FaceCamera';
import LanguageSwitcher from '../components/LanguageSwitcher';
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
// Página de inicio de sesión: permite elegir entre login con contraseña, Google, código OTP o registro
export default function LoginPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
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
    const [newUserId, setNewUserId] = useState(null);
    const [faceSnapshots, setFaceSnapshots] = useState(0);
    const [otpStep, setOtpStep] = useState('email');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpMessage, setOtpMessage] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [loadingRole, setLoadingRole] = useState(false);
    // Vuelve al panel de selección de método de inicio de sesión
    const goBack = () => setActivePanel('choose');
    // Envía las credenciales (usuario/contraseña) al backend y guarda al usuario si el login es correcto
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setLoginMessage(t('login.mustEnterCredentials'));
            return;
        }
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginMessage(data.error || t('login.wrongCredentials'));
                return;
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            setUser({ email: data.user.email, name: data.user.name, picture: '' });
            setLoginMessage('');
            navigate('/home');
        }
        catch {
            setLoginMessage(t('login.connectionError'));
        }
    };
    // Solicita al backend el envío de un código OTP al correo ingresado
    const handleOtpRequest = async (e) => {
        e.preventDefault();
        if (!otpEmail) {
            setOtpMessage(t('login.enterEmail'));
            return;
        }
        setOtpLoading(true);
        setOtpMessage('');
        try {
            const res = await fetch('/api/auth/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpMessage(data.error ?? t('login.errorSendingCode'));
                return;
            }
            setOtpStep('code');
            setOtpMessage(t('login.codeSentTo') + ' ' + otpEmail);
        }
        catch {
            setOtpMessage(t('login.cannotConnect'));
        }
        finally {
            setOtpLoading(false);
        }
    };
    // Verifica el código OTP ingresado y completa el login si es correcto
    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otpCode) {
            setOtpMessage(t('login.enterCode'));
            return;
        }
        setOtpLoading(true);
        setOtpMessage('');
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail, code: otpCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpMessage(data.error ?? t('login.wrongCode'));
                return;
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.token)
                localStorage.setItem('token', data.token);
            setUser({ email: data.user.email, name: data.user.name, picture: '' });
            setOtpMessage('');
            navigate('/home');
        }
        catch {
            setOtpMessage(t('login.cannotConnect'));
        }
        finally {
            setOtpLoading(false);
        }
    };
    // Valida los datos del formulario de registro y crea la cuenta antes de pasar a la captura facial
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!regUsername || !regEmail || !regPassword || !regPassword2) {
            setRegisterMessage(t('login.completeAllFields'));
            return;
        }
        if (regUsername.length < NAME_MIN_LENGTH || regUsername.length > NAME_MAX_LENGTH) {
            setRegisterMessage(t('login.nameLengthInvalid', { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH }));
            return;
        }
        if (regEmail.length > EMAIL_MAX_LENGTH) {
            setRegisterMessage(t('login.emailTooLong', { max: EMAIL_MAX_LENGTH }));
            return;
        }
        if (regPassword.length < PASSWORD_MIN_LENGTH || regPassword.length > PASSWORD_MAX_LENGTH) {
            setRegisterMessage(t('login.passwordLengthInvalid', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }));
            return;
        }
        if (!/[A-Z]/.test(regPassword) || !/[0-9]/.test(regPassword) || !/[^A-Za-z0-9]/.test(regPassword)) {
            setRegisterMessage(t('login.passwordWeak'));
            return;
        }
        if (regPassword !== regPassword2) {
            setRegisterMessage(t('login.passwordsDoNotMatch'));
            return;
        }
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: regUsername,
                    email: regEmail,
                    password: regPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setRegisterMessage(data.error || t('login.errorCreatingAccount'));
                return;
            }
            setNewUserId(String(data.userId));
            setFaceSnapshots(0);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            setRegPassword2('');
            setRegisterMessage('');
            setActivePanel('face-capture');
        }
        catch {
            setRegisterMessage(t('login.connectionError'));
        }
    };
    return (_jsx(GoogleOAuthProvider, { clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', children: _jsx("main", { style: pageStyle, children: _jsxs("section", { style: cardStyle, children: [_jsxs("div", { style: cardTopBarStyle, children: [_jsx(LanguageSwitcher, { style: langSwitcherStyle }), _jsx("button", { style: closeButtonStyle, onClick: () => navigate('/'), children: "\u2715" })] }), activePanel === 'choose' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.systemAccess') }), _jsx("p", { style: subtitleStyle, children: t('login.howToContinue') }), _jsxs("div", { style: choiceListStyle, children: [_jsx("button", { style: choiceButtonStyle, onClick: () => setActivePanel('login'), children: t('login.signIn') }), _jsx("button", { style: choiceButtonStyle, onClick: () => setActivePanel('google'), children: t('login.signInWithGoogle') }), _jsx("button", { style: choiceButtonStyle, onClick: () => {
                                            setOtpStep('email');
                                            setOtpEmail('');
                                            setOtpCode('');
                                            setOtpMessage('');
                                            setActivePanel('otp');
                                        }, children: t('login.signInWithOtp') }), _jsx("button", { style: choiceButtonStyle, onClick: () => setActivePanel('register'), children: t('login.createAccount') })] })] })), activePanel === 'login' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.signIn') }), _jsxs("form", { onSubmit: handleLogin, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "text", placeholder: t('login.placeholder.username'), value: username, onChange: (e) => setUsername(e.target.value) }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { style: { ...inputStyle, paddingRight: '40px' }, type: showPassword ? 'text' : 'password', placeholder: t('login.placeholder.password'), value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: eyeButtonStyle, children: showPassword ? 'Ocultar' : 'Ver' })] }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: t('login.signIn') })] }), loginMessage && _jsx("p", { style: messageStyle, children: loginMessage }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: t('login.back') })] })), activePanel === 'google' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.signInWithGoogle') }), _jsx("p", { style: subtitleStyle, children: t('login.useGoogleAccount') }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', marginTop: '20px' }, children: _jsx(GoogleLogin, { onLogin: (u) => {
                                        localStorage.setItem('user', JSON.stringify(u));
                                        setUser({ email: u.email, name: u.name, picture: u.picture });
                                        navigate('/home');
                                    } }) }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: t('login.back') })] })), activePanel === 'otp' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.oneTimeCode') }), otpStep === 'email' && (_jsxs(_Fragment, { children: [_jsx("p", { style: subtitleStyle, children: t('login.enterEmailForCode') }), _jsxs("form", { onSubmit: handleOtpRequest, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "email", placeholder: t('login.placeholder.emailGeneric'), value: otpEmail, onChange: (e) => setOtpEmail(e.target.value), disabled: otpLoading }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: otpLoading, children: otpLoading ? t('login.sending') : t('login.sendCode') })] })] })), otpStep === 'code' && (_jsxs(_Fragment, { children: [_jsxs("p", { style: subtitleStyle, children: [t('login.codeSentTo'), " ", _jsx("b", { children: otpEmail })] }), _jsxs("form", { onSubmit: handleOtpVerify, style: formStyle, children: [_jsx("input", { style: {
                                                    ...inputStyle,
                                                    textAlign: 'center',
                                                    fontSize: '22px',
                                                    letterSpacing: '8px',
                                                }, type: "text", placeholder: t('login.placeholder.otpCode'), maxLength: 6, value: otpCode, onChange: (e) => setOtpCode(e.target.value.replace(/\D/g, '')), disabled: otpLoading }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: otpLoading, children: otpLoading ? t('login.verifying') : t('login.verifyCode') })] }), _jsx("button", { style: backButtonStyle, onClick: () => {
                                            setOtpStep('email');
                                            setOtpCode('');
                                            setOtpMessage('');
                                        }, children: t('login.changeEmail') })] })), otpMessage && (_jsx("p", { style: otpMessage.includes('enviado') || otpMessage.includes('sent') ? successStyle : messageStyle, children: otpMessage })), _jsx("button", { style: backButtonStyle, onClick: goBack, children: t('login.back') })] })), activePanel === 'register' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.register') }), _jsxs("form", { onSubmit: handleRegister, style: formStyle, children: [_jsx("input", { style: inputStyle, type: "text", placeholder: t('login.placeholder.username'), value: regUsername, maxLength: NAME_MAX_LENGTH, onChange: (e) => setRegUsername(e.target.value) }), _jsx("input", { style: inputStyle, type: "email", placeholder: t('login.placeholder.emailGeneric'), value: regEmail, maxLength: EMAIL_MAX_LENGTH, onChange: (e) => setRegEmail(e.target.value) }), _jsx("input", { style: inputStyle, type: "password", placeholder: t('login.placeholder.password'), value: regPassword, maxLength: PASSWORD_MAX_LENGTH, onChange: (e) => setRegPassword(e.target.value) }), _jsx("input", { style: inputStyle, type: "password", placeholder: t('login.placeholder.repeatPassword'), value: regPassword2, maxLength: PASSWORD_MAX_LENGTH, onChange: (e) => setRegPassword2(e.target.value) }), _jsx("button", { type: "submit", style: primaryButtonStyle, children: t('login.register') })] }), registerMessage && _jsx("p", { style: messageStyle, children: registerMessage }), _jsx("button", { style: backButtonStyle, onClick: goBack, children: t('login.back') })] })), activePanel === 'face-capture' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: t('login.registerFace') }), _jsxs("p", { style: subtitleStyle, children: [t('login.lookAtCamera'), faceSnapshots > 0 && ` ${faceSnapshots} ${faceSnapshots > 1 ? t('login.capturesSavedPlural') : t('login.capturesSaved')}.`] }), _jsx("div", { style: { width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', background: '#000' }, children: _jsx(FaceCamera, { userId: newUserId, onSnapshot: () => setFaceSnapshots(n => n + 1) }) }), faceSnapshots >= 3 && (_jsx("p", { style: successStyle, children: t('login.faceRegisteredSuccessfully') })), _jsx("button", { style: { ...primaryButtonStyle, opacity: faceSnapshots === 0 ? 0.5 : 1 }, disabled: faceSnapshots === 0, onClick: () => {
                                    // En lugar de volver a 'choose' o ir a 'home', pasamos a elegir el rol
                                    setActivePanel('role-selection');
                                    fetch('/api/roles').then(r => r.json()).then(setRoles);
                                }, children: faceSnapshots === 0 ? t('login.waitingCapture') : t('login.finishRegistration') }), _jsx("button", { style: backButtonStyle, onClick: () => {
                                    setNewUserId(null);
                                    setActivePanel('choose');
                                }, children: t('login.skipForNow') })] })), activePanel === 'role-selection' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: titleStyle, children: "Selecciona tu Rol" }), _jsx("p", { style: subtitleStyle, children: "Por favor, elige tu cargo para asignarte los accesos correspondientes." }), _jsxs("form", { onSubmit: async (e) => {
                                    e.preventDefault();
                                    // Usamos el estado newUserId que guardaste durante el registro
                                    if (!selectedRoleId || !newUserId)
                                        return;
                                    setLoadingRole(true);
                                    try {
                                        const res = await fetch('/api/users/role', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId: Number(newUserId), roleId: selectedRoleId })
                                        });
                                        const data = await res.json();
                                        if (data.ok) {
                                            // Guardamos la sesión definitiva y VAMOS AL HOME
                                            localStorage.setItem('user', JSON.stringify(data.user));
                                            localStorage.setItem('token', data.token);
                                            setUser({ email: data.user.email, name: data.user.name, picture: '' });
                                            setNewUserId(null);
                                            navigate('/home');
                                        }
                                        else {
                                            setRegisterMessage(data.error);
                                        }
                                    }
                                    catch (err) {
                                        setRegisterMessage('Error de conexión al asignar rol');
                                    }
                                    finally {
                                        setLoadingRole(false);
                                    }
                                }, style: formStyle, children: [_jsxs("select", { style: inputStyle, value: selectedRoleId, onChange: (e) => setSelectedRoleId(Number(e.target.value)), disabled: loadingRole, children: [_jsx("option", { value: "", disabled: true, children: "Selecciona una opci\u00F3n..." }), roles.map(r => (_jsx("option", { value: r.id, children: r.name }, r.id)))] }), _jsx("button", { type: "submit", style: primaryButtonStyle, disabled: !selectedRoleId || loadingRole, children: loadingRole ? 'Guardando...' : 'Finalizar y Entrar al Sistema' })] }), registerMessage && _jsx("p", { style: messageStyle, children: registerMessage })] }))] }) }) }));
}
const pageStyle = {
    width: '100%',
    minHeight: '100dvh',
    background: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    overflowY: 'auto',
    boxSizing: 'border-box',
};
const cardStyle = {
    position: 'relative',
    width: 'min(380px, 100%)',
    maxHeight: '92dvh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(24px, 6vw, 32px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box',
};
const cardTopBarStyle = {
    position: 'absolute',
    top: '14px',
    right: '16px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};
const closeButtonStyle = {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
};
const langSwitcherStyle = {
    border: '1px solid #d1d5db',
    background: '#f3f4f6',
    color: '#374151',
};
const titleStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
};
const subtitleStyle = {
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
