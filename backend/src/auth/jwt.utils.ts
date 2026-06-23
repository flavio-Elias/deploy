import jwt from "jsonwebtoken";

if (!Bun.env.JWT_SECRET) {
  throw new Error("Falta la variable JWT_SECRET en el archivo .env");
}

const JWT_SECRET = Bun.env.JWT_SECRET;
const TOKEN_TTL = "8h";

export interface AuthTokenPayload {
  userId: number;
  roleId: number | null;
  master: boolean;
}

// Genera un JWT firmado con los datos mínimos de sesión del usuario (expira en 8 horas)
export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Verifica la firma y vigencia de un JWT y devuelve su contenido, o null si no es válido
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

// Extrae el token del header "Authorization: Bearer <token>" y lo verifica
export function getAuthFromRequest(req: Request): AuthTokenPayload | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice("Bearer ".length));
}

// Un usuario es administrador si tiene el rol "Administrador" (id 1) o el flag master en TRUE
export function isAdmin(auth: AuthTokenPayload): boolean {
  return auth.master === true || auth.roleId === 1;
}
