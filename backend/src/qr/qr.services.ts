import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { createGrant } from "../access/access.repository";
import { DEFAULT_TTL_SECONDS } from "../access/access.service";
import crypto from "crypto";

// 1. Configuramos el "cartero" (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: Bun.env.EMAIL_USER,
    pass: Bun.env.EMAIL_PASS,
  },
});

export async function emitirYEnviarQR(userId: number, zoneId: number, logType: "Entrada" | "Salida", emailDestino: string) {
  try {
    // 2. Generamos un Token único y seguro usando la herramienta nativa de Bun/Node
    const tokenGenerado = crypto.randomUUID();
    
    
    
    
    //TEMPORAL PARA LA PRESENTACION (DEMOSTRACION EN CONSOLA)
    console.log("TOKEN GENERADO:", tokenGenerado);






    // 3. Calculamos la expiración (duracion default)
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + DEFAULT_TTL_SECONDS * 1000);

    // 4. GUARDAMOS EN LA BASE DE DATOS
    const nuevoGrant = await createGrant({
      userId: userId,
      zoneId: zoneId,
      logType: logType,
      token: tokenGenerado,
      issuedAt: ahora,
      expiresAt: expiracion,
      status: "active",
    });

    // 5. Transformamos el texto del token a una imagen QR (en formato Base64)
    // Usamos el tokenGenerado porque eso es lo que leerá la cámara después
    const qrImageBase64 = await QRCode.toDataURL(tokenGenerado);




// 6. Enviamos el correo 


    await transporter.sendMail({
      from: `"Sistema de Acceso" <${Bun.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: "Tu Código QR de Acceso",
      html: `
        <h2>¡Hola! Aquí tienes tu acceso.</h2>
        <p>Este código es válido hasta: <b>${expiracion.toLocaleString()}</b></p>
        <p>Muéstralo en la cámara de la entrada para ingresar a la Zona ${zoneId}.</p>
        <br/>
        <img src="cid:codigo-qr-unico" alt="Código QR" style="width: 250px; height: 250px; border: 1px solid #ccc;"/>
      `,
      // ¡NUEVO! Adjuntamos la imagen generada en Base64
      attachments: [
        {
          filename: 'acceso-qr.png',
          path: qrImageBase64,
          cid: 'codigo-qr-unico' // Esta es la llave secreta que conecta el adjunto con el HTML
        }
      ]
    });

    console.log(`✅ QR generado y enviado con éxito a ${emailDestino}, con id de ${userId}, y con zoneid de ${zoneId}`);
    return nuevoGrant;

  } catch (error) {
    console.error("❌ Error al emitir el QR:", error);
    throw error;
  }
}