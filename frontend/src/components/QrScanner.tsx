import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useTranslation } from 'react-i18next'

interface Props {
    zoneId?: number;
    logType?: 'Entrada' | 'Salida';
    onSuccess?:() => void;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

// Escáner de códigos QR: lee el token con la cámara y lo valida contra el backend para una zona
export default function QrScanner({ zoneId = 1, logType = 'Entrada',onSuccess}: Props) {
    const { t } = useTranslation()
    const [status, setStatus] = useState<ScanStatus>('idle')
    const [message, setMessage] = useState('')
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const containerId = 'qr-reader'

    // Detiene la lectura de la cámara del escáner QR si está activa
    const stopScanner = async () => {
        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop()
            }
            scannerRef.current = null
        } catch (error) {
            console.error('Error deteniendo scanner:', error)
        }
    }

    // Envía el token leído del QR al backend para validar el acceso a la zona
    const validateToken = async (token: string) => {
        if (!zoneId) {
            setStatus('error')
            setMessage(t('qrScanner.noZoneSelected'))
            return
        }

        try {       // Llamada al backend para validar el token
            const res = await fetch('http://localhost:3000/api/validate-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, zoneId, logType }),
            })

            const data = await res.json()

            if (data.ok) {
                setStatus('success')
                setMessage(t('qrScanner.accessGranted'))
                setTimeout(() => onSuccess?.(), 1500)
            } else {
                const reasonKey = `qrScanner.reasons.${data.reason}`
                setStatus('error')
                setMessage(t(reasonKey, { defaultValue: t('qrScanner.accessDenied') }))
            }
        } catch {
            setStatus('error')
            setMessage(t('qrScanner.connectionError'))
        }
    }

    // Pide permiso de cámara y arranca la lectura continua de códigos QR
    const startScanner = async () => {
        if (!zoneId) {
            setStatus('error')
            setMessage(t('qrScanner.noZoneSelected'))
            return
        }

        await stopScanner()

        setStatus('scanning')
        setMessage('')

        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                async (decodedText) => {
                    await stopScanner()
                    await validateToken(decodedText)
                },
                () => {}
            )
        } catch (error) {
            console.error('Error iniciando scanner:', error)
            const noWebcam = /NotFoundError|DevicesNotFoundError|OverconstrainedError/.test(String(error))
            setStatus('error')
            setMessage(noWebcam ? t('qrScanner.noWebcamDetected') : t('qrScanner.cannotStartCamera'))
        }
    }

    // Detiene el escáner y vuelve al estado inicial para poder escanear de nuevo
    const reset = async () => {
        await stopScanner()
        setStatus('idle')
        setMessage('')
    }

    useEffect(() => {
        return () => {
            void stopScanner()
        }
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <h2>{t('qrScanner.title')} {zoneId ? `— ${t('qrScanner.zone')} ${zoneId}` : ''}</h2>

            <div
                id={containerId}
                style={{
                    width: 'min(320px, 100%)',
                    display: status === 'scanning' ? 'block' : 'none',
                }}
            />

            {status === 'idle' && (
                <button onClick={startScanner} style={btnStyle('#1976d2')}>
                    {t('qrScanner.startScan')}
                </button>
            )}

            {status === 'scanning' && (
                <button onClick={reset} style={btnStyle('#757575')}>
                    {t('qrScanner.cancel')}
                </button>
            )}

            {(status === 'success' || status === 'error') && (
                <>
                    <div style={{
                        padding: '16px 24px',
                        borderRadius: '8px',
                        background: status === 'success' ? '#e8f5e9' : '#ffebee',
                        color: status === 'success' ? '#2e7d32' : '#c62828',
                        fontWeight: 600,
                        fontSize: '18px',
                    }}>
                        {message}
                    </div>

                    <button onClick={reset} style={btnStyle('#1976d2')}>
                        {t('qrScanner.scanAnother')}
                    </button>
                </>
            )}
        </div>
    )
}

function btnStyle(bg: string): React.CSSProperties {
    return {
        padding: '10px 24px',
        background: bg,
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer',
    }
}
