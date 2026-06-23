import { describe, it, expect, mock } from "bun:test";

const log = {
  info:  (msg: string) => console.log(`\x1b[34m[INFO]\x1b[0m  ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
};

mock.module("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async () => ({ messageId: "mock-id" }),
    }),
  },
}));

mock.module("../access/access.repository", () => ({
  findUserByEmail: async (email: string) => ({ email, name: "Test", roleId: 1 }),
}));

const { requestOtp, verifyOtp } = await import("../src/otp/otp.service");

const expected_mail = "flavio2medioa@gmail.com";

// ══════════════════════════════════════════════════════════════════
describe("configuración del correo", () => {

  it("el correo sigue siendo el original", () => {
    const actual_mail = Bun.env.EMAIL_USER ?? expected_mail;

    if (actual_mail === expected_mail) {
      log.info(`El correo no ha cambiado: "${actual_mail}"`);
    } else {
      log.error(`El correo fue modificado a: "${actual_mail}", se esperaba: "${expected_mail}"`);
    }

    expect(actual_mail).toBe(expected_mail);
  });

});

// ══════════════════════════════════════════════════════════════════
describe("requestOtp()", () => {

  it("genera y envía un OTP correctamente", async () => {
    log.info("Enviando OTP a test@example.com...");
    const result = await requestOtp("test@example.com");
    expect(result).toEqual({ ok: true });
  });

});

// ══════════════════════════════════════════════════════════════════
describe("verifyOtp()", () => {

  it("rechaza un código incorrecto", async () => {
    await requestOtp("test@example.com");
    await expect(verifyOtp("test@example.com", "000000"))
      .rejects.toThrow("Código incorrecto");
    log.error("Código incorrecto rechazado correctamente");
  });

  it("lanza error si no hay OTP activo para el correo", async () => {
    await expect(verifyOtp("noexiste@example.com", "123456"))
      .rejects.toThrow("No hay un código activo para este correo");
    log.error("Correo sin OTP activo rechazado correctamente");
  });

});
