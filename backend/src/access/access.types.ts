//Tipos de datos para el modulo de acceso
export type RoleName = "Administrador"|"Empleado General"|"Seguridad"|"Mantenimiento"|"Visita"|"Proveedor"|"Gerencia";

export type AccessGrantStatus = "active"|"used"|"expired"|"revoked";

//Tipos de datos que representan las filas de la base de datos
export type UserRow = {
  id: number;
  name: string;
  email: string | null;
  passw: string | null;
  role_id: number;
  master: boolean;
};

//Tipos de datos que representan las filas de la base de datos
export type ZoneRow = {
  id: number;
  name: string;
};

//Nota de Xx_Looff_xX: No se si la variable Date guarda tmbn la hora, de lo contrario, habria que añadir otra variable
//Nota parte 2: Puedo añadir ZoneId para saber a que zona se le dio el acceso (en caso de que queramos hacer qrs mas restrictivos), aunque no se si es necesario
export type AccessGrantRow = {
  id: number;
  user_id: number;
  zone_id:number;
  log_type: "Entrada" | "Salida";
  token: string;
  issued_at: Date;
  expires_at: Date;
  status: AccessGrantStatus;
};

//Nota de Xx_Looff_xX: Forma de los usuarios
export type User = {
  id: number;
  name: string;
  email: string | null;
  passw: string | null;
  roleId: number;
  master: boolean;
};

export type Zone = {
  id: number;
  name: string;
};

//Los grants son los permisos de acceso que se le dan a un usuario para entrar o salir de una zona, con un token unico y un tiempo de vida limitado
export type AccessGrant = {
  id: number;
  userId: number;
  zoneId: number;
  logType: "Entrada" | "Salida";
  token: string;
  issuedAt: Date;
  expiresAt: Date;
  status: AccessGrantStatus;
};


//Nota de Xx_Looff_xX: ZoneId en caso de querer grants para zonas especificas
export type CreateAccessGrantRequest = {
  userId: number;
  zoneId: number;
  logType: "Entrada" | "Salida";
  ttlSeconds?: number;
};

//Resultado de la validacion de acceso
export type AccessValidationResult = {
  ok: boolean;
  reason?: "not_found" | "used" | "expired" | "revoked" | "unauthorized_zone";
};

//Lo que llega desde el lector QR al backend para validar acceso, si queremos validar por zona añadimos zoneId
export type ValidateAccessInput = {
  token: string;
  zoneId: number;
};

export type AccessLogDisplay = { //Este type lo usaremos oara sacar el historial
  id: number;
  userName: string;
  zoneName: string;
  logType: "Entrada" | "Salida";
  accessMethod: string;
  granted: boolean;
  timestamp: Date;
};