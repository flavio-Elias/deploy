import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FaceCamera from '../components/FaceCamera';
import LanguageSwitcher from '../components/LanguageSwitcher';
// Pantalla principal con la cámara para reconocimiento facial (login y kiosko de acceso)
export default function CameraPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    // Guarda al usuario reconocido por la cámara y lo lleva al panel principal
    const handleFaceLogin = (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/home');
    };
    return (_jsxs("main", { style: pageStyle, children: [_jsxs("div", { style: cameraContainerStyle, children: [_jsx(FaceCamera, { onRecognized: handleFaceLogin }), _jsx(FaceCamera, {})] }), _jsxs("div", { style: topRightStyle, children: [_jsx(LanguageSwitcher, {}), _jsx("button", { style: loginButtonStyle, onClick: () => navigate('/login'), children: t('camera.login') })] })] }));
}
const pageStyle = {
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
const topRightStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 10,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};
const loginButtonStyle = {
    padding: '10px 22px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.14)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
};
