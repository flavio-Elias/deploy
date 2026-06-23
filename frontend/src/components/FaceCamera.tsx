import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as faceapi from '@vladmandic/face-api'

interface RecognizedUser {
    id: number
    name: string
}

interface Props {
    userId?: string | null
    zoneId?: number
    logType?: 'Entrada' | 'Salida' 
    onRecognized?: (user: RecognizedUser) => void
    onSnapshot?: () => void
}

type CameraStatus = 'idle' | 'loading' | 'running' | 'stopped' | 'error'

const SNAPSHOT_INTERVAL_MS = 3000
const MODELS_URL = '/models'

// Cámara con detección facial en vivo: registra rostros nuevos (con userId) o reconoce usuarios existentes
export default function FaceCamera({ userId, zoneId, logType = 'Entrada',onRecognized, onSnapshot }: Props) {
    const { t } = useTranslation()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number>(0)
    const lastSaveRef = useRef<number>(0)
    const modelsLoadedRef = useRef(false)
    const detectingRef = useRef(false)

    const [status, setStatus] = useState<CameraStatus>('idle')
    const [snapshots, setSnapshots] = useState(0)
    const [faceDetected, setFaceDetected] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [recognizedUser, setRecognizedUser] = useState<RecognizedUser | null>(null)

    // Detiene la animación de detección y apaga la cámara del dispositivo
    const stopCamera = () => {
        cancelAnimationFrame(rafRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }

    // Carga los modelos de face-api.js una sola vez (detección, landmarks y reconocimiento)
    const loadModels = async () => {
        if (modelsLoadedRef.current) return
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        ])
        modelsLoadedRef.current = true
    }

    // Convierte el frame actual en JPEG y lo envía junto con su embedding para registrar el rostro de un usuario nuevo
    const saveSnapshot = async (canvas: HTMLCanvasElement, descriptor: Float32Array) => {
        return new Promise<void>((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) return resolve()
                const reader = new FileReader()
                reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1]
                    try {
                        await fetch('/api/face-snapshot', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId,
                                imageBase64: base64,
                                mimeType: 'image/jpeg',
                                embedding: Array.from(descriptor),
                            }),
                        })
                        setSnapshots(n => n + 1)
                        onSnapshot?.()
                    } catch (err) {
                        console.error('Error al guardar snapshot:', err)
                    }
                    resolve()
                }
                reader.readAsDataURL(blob)
            }, 'image/jpeg', 0.85)
        })
    }

    // Envía el embedding detectado al backend para buscar coincidencia y validar el acceso a la zona
    const recognizeFace = async (descriptor: Float32Array) => {
        try {
            const res = await fetch('/api/face-recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embedding: Array.from(descriptor),
                    logType,
                    ...(zoneId != null && { zoneId }),
                }),
            })
            const data = await res.json()
            if (data.ok) {
                if (data.token) localStorage.setItem('token', data.token)
                setRecognizedUser(data.user)
                onRecognized?.(data.user)
            } else {
                setRecognizedUser(null)
            }
        } catch (err) {
            console.error('Error en reconocimiento facial:', err)
        }
    }

    // Bucle por cada frame: detecta el rostro, dibuja el recuadro y, cada cierto intervalo, guarda o reconoce
    const detect = async () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(detect)
            return
        }

        if (detectingRef.current) {
            rafRef.current = requestAnimationFrame(detect)
            return
        }
        detectingRef.current = true

        try {
            const result = await faceapi
                .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor()

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0)

            const hasFace = !!result
            setFaceDetected(hasFace)

            if (result) {
                const { x, y, width, height } = result.detection.box
                ctx.strokeStyle = '#00e676'
                ctx.lineWidth = 2
                ctx.strokeRect(x, y, width, height)

                const now = Date.now()
                if (now - lastSaveRef.current >= SNAPSHOT_INTERVAL_MS) {
                    lastSaveRef.current = now
                    if (userId) {
                        await saveSnapshot(canvas, result.descriptor)
                    } else {
                        await recognizeFace(result.descriptor)
                    }
                }
            } else {
                if (!userId) setRecognizedUser(null)
            }
        } finally {
            detectingRef.current = false
        }

        rafRef.current = requestAnimationFrame(detect)
    }

    // Carga los modelos, pide permiso de cámara al navegador y arranca el bucle de detección
    const start = async () => {
        setStatus('loading')
        try {
            await loadModels()
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
            setStatus('running')
            rafRef.current = requestAnimationFrame(detect)
        } catch (err: unknown) {
            console.error('Error al iniciar cámara:', err)
            const name = err instanceof DOMException ? err.name : ''
            const noWebcam = name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError'
            setErrorMsg(noWebcam ? t('faceCamera.noWebcamDetected') : t('faceCamera.cannotStartCamera'))
            setStatus('error')
        }
    }

    // Detiene la cámara manualmente desde el botón de la interfaz
    const stop = () => {
        stopCamera()
        setStatus('stopped')
        setFaceDetected(false)
    }

    useEffect(() => {
        start()
        return () => stopCamera()
    }, [])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Oculto visualmente pero renderizado para que face-api.js pueda leer los frames */}
            <video
                ref={videoRef}
                muted
                playsInline
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1, top: 0, left: 0, pointerEvents: 'none' }}
            />

            {status === 'loading' && (
                <div style={overlayStyle}>
                    <p style={{ color: '#fff', fontSize: '18px' }}>{t('faceCamera.loadingModels')}</p>
                </div>
            )}

            {status === 'stopped' && (
                <div style={overlayStyle}>
                    <button onClick={start} style={btnStyle('#1976d2')}>{t('faceCamera.restartCamera')}</button>
                </div>
            )}

            {status === 'error' && (
                <div style={overlayStyle}>
                    <p style={{ color: '#ff5252', fontSize: '16px', marginBottom: '12px', textAlign: 'center', padding: '0 16px' }}>
                        {errorMsg || t('faceCamera.cannotStartCamera')}
                    </p>
                    <button onClick={start} style={btnStyle('#1976d2')}>{t('faceCamera.retry')}</button>
                </div>
            )}

            {status === 'idle' && (
                <div style={overlayStyle}>
                    <button onClick={start} style={btnStyle('#1976d2')}>{t('faceCamera.startCamera')}</button>
                </div>
            )}

            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: status === 'running' ? 'block' : 'none',
                }}
            />

            {status === 'running' && (
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {userId ? (
                        <span style={{
                            background: faceDetected ? '#00e676' : 'rgba(0,0,0,0.5)',
                            color: faceDetected ? '#000' : '#fff',
                            padding: '4px 14px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                        }}>
                            {faceDetected
                                ? t(snapshots === 1 ? 'faceCamera.savingCaptures' : 'faceCamera.savingCapturesPlural', { count: snapshots })
                                : t('faceCamera.lookingForFace')}
                        </span>
                    ) : (
                        <span style={{
                            background: recognizedUser
                                ? '#00e676'
                                : faceDetected
                                    ? 'rgba(255,165,0,0.85)'
                                    : 'rgba(0,0,0,0.5)',
                            color: recognizedUser || faceDetected ? '#000' : '#fff',
                            padding: '6px 18px',
                            borderRadius: '20px',
                            fontSize: '15px',
                            fontWeight: 700,
                        }}>
                            {recognizedUser
                                ? t('faceCamera.welcome', { name: recognizedUser.name })
                                : faceDetected
                                    ? t('faceCamera.identifying')
                                    : t('faceCamera.lookingForFace')}
                        </span>
                    )}
                    <button onClick={stop} style={btnStyle('#c62828')}>{t('faceCamera.stop')}</button>
                </div>
            )}
        </div>
    )
}

const overlayStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111',
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
