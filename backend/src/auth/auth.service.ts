import { findUserByName, createUser } from "../access/access.repository";
import { hashPassword } from "./auth.utils";

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// Valida que nombre, correo y contraseña cumplan los requisitos antes de registrar al usuario
export function validateRegistrationInput(name: string, email: string, password: string) {
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    throw new Error(`El nombre debe tener entre ${NAME_MIN_LENGTH} y ${NAME_MAX_LENGTH} caracteres`);
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    throw new Error(`El correo no debe superar los ${EMAIL_MAX_LENGTH} caracteres`);
  }

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`);
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error("La contraseña debe incluir al menos una mayúscula, un número y un símbolo");
  }
}

// Valida, hashea la contraseña y crea un nuevo usuario con rol de visitante por defecto
export async function registerUser(name: string, email: string, passwPlana: string) {
  validateRegistrationInput(name, email, passwPlana);

  const existingUser = await findUserByName(name);
  if (existingUser) {
    throw new Error("El nombre de usuario ya está registrado");
  }

  const hashedPassw = await hashPassword(passwPlana); //hasheamos

  const newUser = await createUser({ //guardamos
    name,
    email,
    passw: hashedPassw,
    roleId: 5 //Por default les daremos el rol de visitante
  });

  return newUser;
}