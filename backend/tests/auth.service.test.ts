import { describe, it, expect, mock, beforeEach } from "bun:test";

let existingUser: { id: number; name: string } | null = null;

const createUserMock = mock(async (data: any) => ({ id: 1, ...data }));
const hashPasswordMock = mock(async (password: string) => `hashed:${password}`);

mock.module("../src/access/access.repository", () => ({
  findUserByName: async (_name: string) => existingUser,
  createUser: createUserMock,
}));

mock.module("../src/auth/auth.utils", () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: async () => true,
}));

const { registerUser, validateRegistrationInput } = await import("../src/auth/auth.service");

const VALID_NAME = "validUser";
const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "Abcdef1!";

beforeEach(() => {
  existingUser = null;
  createUserMock.mockClear();
  hashPasswordMock.mockClear();
});

// ══════════════════════════════════════════════════════════════════
describe("validateRegistrationInput()", () => {

  it("acepta datos válidos sin lanzar error", () => {
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, VALID_PASSWORD)).not.toThrow();
  });

  it("rechaza un nombre muy corto", () => {
    expect(() => validateRegistrationInput("a", VALID_EMAIL, VALID_PASSWORD)).toThrow();
  });

  it("rechaza un nombre muy largo (>100 caracteres)", () => {
    const longName = "a".repeat(101);
    expect(() => validateRegistrationInput(longName, VALID_EMAIL, VALID_PASSWORD)).toThrow();
  });

  it("acepta un nombre de exactamente 100 caracteres", () => {
    const name100 = "a".repeat(100);
    expect(() => validateRegistrationInput(name100, VALID_EMAIL, VALID_PASSWORD)).not.toThrow();
  });

  it("rechaza un correo muy largo (>100 caracteres)", () => {
    const longEmail = `${"a".repeat(95)}@a.com`;
    expect(longEmail.length).toBeGreaterThan(100);
    expect(() => validateRegistrationInput(VALID_NAME, longEmail, VALID_PASSWORD)).toThrow();
  });

  it("rechaza una contraseña muy corta (<8 caracteres)", () => {
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, "Ab1!")).toThrow();
  });

  it("rechaza una contraseña muy larga (>128 caracteres)", () => {
    const longPassword = "Ab1!" + "a".repeat(126);
    expect(longPassword.length).toBeGreaterThan(128);
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, longPassword)).toThrow();
  });

  it("rechaza una contraseña sin mayúscula", () => {
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, "abcdef1!")).toThrow();
  });

  it("rechaza una contraseña sin número", () => {
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, "Abcdefg!")).toThrow();
  });

  it("rechaza una contraseña sin símbolo", () => {
    expect(() => validateRegistrationInput(VALID_NAME, VALID_EMAIL, "Abcdefg1")).toThrow();
  });

});

// ══════════════════════════════════════════════════════════════════
describe("registerUser()", () => {

  it("lanza error si el nombre de usuario ya existe", async () => {
    existingUser = { id: 1, name: VALID_NAME };

    await expect(registerUser(VALID_NAME, VALID_EMAIL, VALID_PASSWORD))
      .rejects.toThrow("El nombre de usuario ya está registrado");

    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("rechaza datos inválidos antes de consultar la base de datos", async () => {
    await expect(registerUser("a", VALID_EMAIL, VALID_PASSWORD)).rejects.toThrow();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("crea el usuario con la contraseña hasheada y el rol visitante por defecto", async () => {
    const result = await registerUser(VALID_NAME, VALID_EMAIL, VALID_PASSWORD);

    expect(hashPasswordMock).toHaveBeenCalledWith(VALID_PASSWORD);
    expect(createUserMock).toHaveBeenCalledWith({
      name: VALID_NAME,
      email: VALID_EMAIL,
      passw: `hashed:${VALID_PASSWORD}`,
      roleId: 5,
    });
    expect(result).toEqual({
      id: 1,
      name: VALID_NAME,
      email: VALID_EMAIL,
      passw: `hashed:${VALID_PASSWORD}`,
      roleId: 5,
    });
  });

});
