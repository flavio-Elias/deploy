import nodemailer from "nodemailer";
import { findUserByEmail } from "../access/access.repository";

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

const otpStore = new Map<string, OtpEntry>();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "flavio2medioa@gmail.com",
    pass: Bun.env.EMAIL_PASS,
  },
});

// Genera un código de un solo uso (OTP) de 6 dígitos, lo guarda 5 minutos y lo envía por correo
export async function requestOtp(email: string): Promise<{ ok: boolean }> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  otpStore.set(email, { code, expiresAt });

  await transporter.sendMail({
    from: `"Sistema de Acceso" <${Bun.env.EMAIL_USER}>`,
    to: email,
    subject: "Tu código de acceso de un solo uso",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2>Código de acceso</h2>
        <p>Tu código de un solo uso es:</p>
        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</p>
        <p>Válido por <b>5 minutos</b>. No compartas este código con nadie.</p>
      </div>
    `,
  });

  return { ok: true };
}

// Verifica que el código OTP recibido coincida y no haya expirado, y devuelve al usuario asociado
export async function verifyOtp(email: string, code: string) {
  const entry = otpStore.get(email);

  if (!entry) throw new Error("No hay un código activo para este correo");
  if (new Date() > entry.expiresAt) {
    otpStore.delete(email);
    throw new Error("El código ha expirado, solicita uno nuevo");
  }
  if (entry.code !== code) throw new Error("Código incorrecto");

  otpStore.delete(email);

  // Identity proven by email ownership; user row may or may not exist (e.g. Google SSO users)
  const user = await findUserByEmail(email);
  if (!user) {
    return { ok: true, user: { id: null, email, name: email.split("@")[0], roleId: null, master: false } };
  }

  // No devolvemos el hash de la contraseña (passw) al frontend
  return { ok: true, user: { id: user.id, name: user.name, email: user.email, roleId: user.roleId, master: user.master } };
}
