import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
// Permite subir una foto y genera su embedding con MobileNet para guardarlo en el backend
function ImageUpload({ userId }) {
    const [status, setStatus] = useState('idle');
    // Procesa el archivo seleccionado: lo carga, obtiene el embedding con MobileNet y lo envía al backend
    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setStatus('processing');
        try {
            // Creamos una URL temporal para leer la imagen del input
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.src = url;
            await new Promise((resolve) => (img.onload = resolve));
            // Cargamos el modelo MobileNet preentrenado
            const model = await mobilenet.load();
            // Convertimos la imagen a un tensor y obtenemos el embedding
            // El segundo argumento "true" hace que retorne el vector de características
            // en vez de las probabilidades de clasificación (1024 dimensiones)
            const tensor = tf.browser.fromPixels(img);
            const embedding = model.infer(tensor, true);
            const embeddingArray = Array.from(await embedding.data());
            // Liberamos memoria de los tensores
            tensor.dispose();
            embedding.dispose();
            URL.revokeObjectURL(url);
            // Enviamos el embedding al backend para guardarlo en MinIO
            const res = await fetch('/api/embedding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, embedding: embeddingArray }),
            });
            if (!res.ok)
                throw new Error(`Backend returned ${res.status}`);
            setStatus('done');
        }
        catch (err) {
            console.error('Error al procesar la imagen:', err);
            setStatus('error');
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }, children: [_jsx("p", { children: "Sube una foto tuya para registrar tu rostro" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleFile, disabled: status === 'processing' }), status === 'processing' && _jsx("p", { children: "Procesando imagen con MobileNet..." }), status === 'done' && _jsx("p", { children: "Embedding guardado correctamente" }), status === 'error' && _jsx("p", { children: "Error al procesar la imagen" })] }));
}
export default ImageUpload;
