import { db } from "../DB/postgres";
import type { AccessGrantRow, UserRow, ZoneRow, 
  AccessGrant, User, Zone, AccessLogDisplay} from "./access.types";


//IMPORTANTE:
//en type  "algo"row, dejar el nombre y la cantidad de variables igual a como estan en la base de datos, cualquier cambio debe verse reflejado aqui tmbn
//:)
//R: Eso haré looff, no re preocupes nya :3 
// Preguntar al profe si debemos poner una barrera en caso de que 2 tokens colisionen
// R: imagino que si, pero por ahora no sera necesario, cuando subamos la base de datos a la nube ahi si :b


//Funcion de mapeo (de la bbdd a lenguaje backend)
function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passw: row.passw,
    roleId: row.role_id,
    master: row.master
  };
}

//Mapeo de zonas (de la bbdd a lenguaje backend)
function mapZoneRow(row: ZoneRow): Zone {
  return {
    id: row.id,
    name: row.name
  };
}

//Adivinen :), Otro mapeo, ahora del grant
function mapGrantRow(row: AccessGrantRow): AccessGrant {
  return {
    id: row.id,
    userId: row.user_id,
    zoneId: row.zone_id,
    logType: row.log_type,
    token: row.token,
    issuedAt: new Date(row.issued_at),
    expiresAt: new Date(row.expires_at),
    status: row.status
  };
}

// Inserta un nuevo usuario en la base de datos y devuelve el registro creado
export async function createUser(input: {
  name: string;
  email: string;
  passw: string;
  roleId: number;
}): Promise<User> {
  const rows = await db<UserRow[]>`
    INSERT INTO users (name, email, role_id, passw, master)
    VALUES (${input.name}, ${input.email}, ${input.roleId}, ${input.passw}, TRUE)
    RETURNING id, name, email, role_id, passw, master
  `;
  return mapUserRow(rows[0]);
}

// Busca un usuario activo por su nombre de usuario (se usa en el login con contraseña)
export async function findUserByName(name: string): Promise<User | null> {
  const rows = await db<UserRow[]>`
    SELECT id, name, role_id, email, passw, master
    FROM users
    WHERE name = ${name}
    AND is_active = TRUE
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapUserRow(row) : null;
}

// Busca un usuario activo por su correo (se usa en login con Google, OTP y QR)
export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await db<UserRow[]>`
    SELECT id, name, role_id, email, passw, master
    FROM users
    WHERE email = ${email}
    AND is_active = TRUE
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapUserRow(row) : null;
}

// Busca un usuario por correo y, si no existe, lo crea (usado en el login con Google)
export async function findOrCreateGoogleUser(email: string, name: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const rows = await db<UserRow[]>`
    INSERT INTO users (name, email, role_id)
    VALUES (${name}, ${email}, 5)
    RETURNING id, name, email, role_id, passw
  `;
  return mapUserRow(rows[0]);
}

// Busca un usuario activo por su id
export async function findUserById(userId: number): Promise<User | null> {
  const rows = await db<UserRow[]>`
    SELECT id, name, role_id, email, passw, master
    FROM users
    WHERE id = ${userId}
    AND is_active = TRUE
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapUserRow(row) : null;
}

// Devuelve todos los usuarios (activos e inactivos) para el panel de administración
export async function getAllUsers() {
  return await db`SELECT id, name, email, is_active FROM users ORDER BY name ASC`;
}

// Busca una zona por su id
export async function findZoneById(zoneId: number): Promise<Zone | null> {
  const rows = await db<ZoneRow[]>`
    SELECT id, name
    FROM zones
    WHERE id = ${zoneId}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapZoneRow(row) : null;
}

// Busca un permiso de acceso (grant) a partir del token generado para el QR
export async function findGrantByToken(token: string): Promise<AccessGrant | null> {
  const rows = await db<AccessGrantRow[]>`
    SELECT id, user_id, zone_id, log_type, token, issued_at, expires_at, status
    FROM access_grants
    WHERE token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapGrantRow(row) : null;
}

// Crea un nuevo permiso de acceso (grant) asociado a un token de QR
export async function createGrant(input: {
  userId: number;
  zoneId: number;
  logType: "Entrada" | "Salida";
  token: string;
  issuedAt: Date;
  expiresAt: Date;
  status: "active";
}): Promise<AccessGrant> { //ojo con el zoneId
  const rows = await db<AccessGrantRow[]>`
    INSERT INTO access_grants (user_id, zone_id, log_type, token, issued_at, expires_at, status) 
    VALUES (
      ${input.userId},
      ${input.zoneId},
      ${input.logType},
      ${input.token},
      ${input.issuedAt},
      ${input.expiresAt},
      ${input.status}
    )
    RETURNING id, user_id, zone_id, log_type, token, issued_at, expires_at, status
  `;
  return mapGrantRow(rows[0]);
}

// Marca un permiso de acceso como "usado" para que el mismo QR no se pueda reutilizar
export async function markGrantAsUsed(grantId: number): Promise<void> {
  await db`
    UPDATE access_grants
    SET status = 'used'
    WHERE id = ${grantId}
    AND status = 'active'
  `;
}

// Verifica si un rol tiene permiso para acceder a una zona determinada (busca en la bbdd si existe la relacion)
export async function roleHasZonePermission(roleId: number, zoneId: number): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM role_zone_permissions
      WHERE role_id = ${roleId}
        AND zone_id = ${zoneId}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

// Registra en el historial un intento de acceso (exitoso o no) a una zona
export async function createAccessLog(input: {
  userId: number;
  zoneId: number;
  logType: "Entrada" | "Salida";
  accessMethod: "QR" | "CARA";
  granted: boolean;
}): Promise<void> {
  await db`
    INSERT INTO access_logs (user_id, zone_id, log_type, access_method, granted)
    VALUES (${input.userId}, ${input.zoneId}, ${input.logType}, ${input.accessMethod}, ${input.granted})
  `;
}

// Devuelve todas las zonas registradas, ordenadas por id
export async function getAllZones(): Promise<Zone[]> {
  const rows = await db<ZoneRow[]>`
    SELECT id, name
    FROM zones
    ORDER BY id ASC
  `;
  return rows.map(mapZoneRow);
}


// Guarda en la base de datos la referencia a una foto de rostro junto con su embedding facial
export async function saveFaceSnapshot(input: {
  userId: number;
  filePath: string;
  iv: string;
  embedding: number[];
}): Promise<void> {
  const embeddingLiteral = `[${input.embedding.join(",")}]`
  await db`
    INSERT INTO face_snapshots (user_id, file_path, iv, embedding)
    VALUES (${input.userId}, ${input.filePath}, ${input.iv}, ${embeddingLiteral}::vector)
  `
}

// Busca el rostro más parecido (menor distancia) al embedding recibido desde la cámara
export async function findNearestFaceMatch(
  embedding: number[],
  threshold = 0.55
): Promise<{ userId: number; name: string; distance: number } | null> {
  const vectorLiteral = `[${embedding.join(",")}]`
  const rows = await db<{ user_id: number; name: string; distance: number }[]>`
    SELECT fs.user_id, u.name, (fs.embedding <-> ${vectorLiteral}::vector) AS distance
    FROM face_snapshots fs
    JOIN users u ON fs.user_id = u.id
    WHERE fs.embedding IS NOT NULL
    ORDER BY distance
    LIMIT 1
  `
  if (!rows[0] || rows[0].distance > threshold) return null
  return { userId: rows[0].user_id, name: rows[0].name, distance: rows[0].distance }
}

export async function getRecentAccessLogs(): Promise<AccessLogDisplay[]> { //lo dejare con 50 registros por ahora, dudo que vayamos a tener más xd
  const rows = await db<any[]>`
    SELECT 
      al.id, 
      u.name as "userName", 
      z.name as "zoneName",
      al.log_type as "logType",
      al.access_method as "accessMethod", 
      al.granted, 
      al.timestamp
    FROM access_logs al
    JOIN users u ON al.user_id = u.id
    JOIN zones z ON al.zone_id = z.id
    ORDER BY al.timestamp DESC
    LIMIT 50
  `;
  
  return rows.map(row => ({
    id: row.id,
    userName: row.userName,
    zoneName: row.zoneName,
    logType: row.logType,
    accessMethod: row.accessMethod,
    granted: row.granted,
    timestamp: new Date(row.timestamp)
  }));
}

// Verifica si un usuario tiene un baneo activo en una zona específica
export async function isUserBannedFromZone(userId: number, zoneId: number): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM user_zone_bans 
      WHERE user_id = ${userId} AND zone_id = ${zoneId}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

// Agrega o quita el baneo de un usuario sobre una zona específica
export async function toggleUserZoneBan(userId: number, zoneId: number, ban: boolean): Promise<void> {
  if (ban) {
    await db`INSERT INTO user_zone_bans (user_id, zone_id) VALUES (${userId}, ${zoneId}) ON CONFLICT DO NOTHING`;
  } else {
    await db`DELETE FROM user_zone_bans WHERE user_id = ${userId} AND zone_id = ${zoneId}`;
  }
}

// Elimina todas las fotos/embeddings faciales guardados de un usuario
export async function deleteBiometrics(userId: number): Promise<void> {
  await db`DELETE FROM face_snapshots WHERE user_id = ${userId}`;
}

// Activa o desactiva la cuenta de un usuario (los usuarios inactivos no pueden iniciar sesión ni acceder)
export async function toggleUserStatus(userId: number, isActive: boolean): Promise<void> {
  await db`UPDATE users SET is_active = ${isActive} WHERE id = ${userId}`;
}

// MÉTRICAS DE REPORTES PARA UN USUARIO
// Cuenta las entradas concedidas de un usuario agrupadas por día de la semana
export async function getUserAssistanceByDay(userId: number) {
  return await db`
    SELECT 
        TO_CHAR(timestamp, 'TMDay') AS dia_semana,
        COUNT(*)::int AS total_asistencias
    FROM access_logs
    WHERE user_id = ${userId}
      AND log_type = 'Entrada' 
      AND granted = true
    GROUP BY EXTRACT(ISODOW FROM timestamp), TO_CHAR(timestamp, 'TMDay')
    ORDER BY EXTRACT(ISODOW FROM timestamp);
  `;
}

// Cuenta las entradas concedidas de un usuario agrupadas por hora del día
export async function getUserDistributionByHour(userId: number) {
  return await db`
    SELECT 
        EXTRACT(HOUR FROM timestamp)::int AS hora_del_dia,
        COUNT(*)::int AS cantidad_ingresos
    FROM access_logs
    WHERE user_id = ${userId}
      AND log_type = 'Entrada' 
      AND granted = true
    GROUP BY hora_del_dia
    ORDER BY hora_del_dia ASC;
  `;
}

// Devuelve la zona a la que un usuario ha entrado con más frecuencia
export async function getUserMostFrequentZone(userId: number) {
  const rows = await db`
    SELECT 
        z.name AS nombre_zona,
        COUNT(*)::int AS cantidad_accesos
    FROM access_logs al
    JOIN zones z ON al.zone_id = z.id
    WHERE al.user_id = ${userId}
      AND al.log_type = 'Entrada' 
      AND al.granted = true
    GROUP BY z.name
    ORDER BY cantidad_accesos DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

// Suma las horas totales que un usuario ha permanecido dentro de las instalaciones (pares Entrada/Salida)
export async function getUserTotalHours(userId: number) {
  const rows = await db`
    WITH estadias_emparejadas AS (
        SELECT 
            user_id,
            zone_id,
            timestamp AS hora_entrada,
            LEAD(timestamp) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS hora_salida,
            log_type AS tipo_actual,
            LEAD(log_type) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS siguiente_tipo
        FROM access_logs
        WHERE granted = true
    )
    SELECT 
        ROUND(EXTRACT(EPOCH FROM SUM(hora_salida - hora_entrada)) / 3600, 2)::float AS total_horas
    FROM estadias_emparejadas
    WHERE user_id = ${userId}
      AND tipo_actual = 'Entrada' 
      AND siguiente_tipo = 'Salida';
  `;
  return rows[0]?.total_horas ?? 0;
}

// Calcula el promedio de minutos que un usuario permanece por visita (pares Entrada/Salida)
export async function getUserAverageStayDuration(userId: number) {
  const rows = await db`
    WITH estadias_emparejadas AS (
        SELECT 
            user_id,
            zone_id,
            timestamp AS hora_entrada,
            LEAD(timestamp) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS hora_salida,
            log_type AS tipo_actual,
            LEAD(log_type) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS siguiente_tipo
        FROM access_logs
        WHERE granted = true
    )
    SELECT 
        ROUND(EXTRACT(EPOCH FROM AVG(hora_salida - hora_entrada)) / 60, 2)::float AS promedio_minutos
    FROM estadias_emparejadas
    WHERE user_id = ${userId}
      AND tipo_actual = 'Entrada' 
      AND siguiente_tipo = 'Salida';
  `;
  return rows[0]?.promedio_minutos ?? 0;
}

// MÉTRICA GLOBAL (MÁXIMO TIEMPO ACUMULADO)
// Devuelve el usuario con más horas acumuladas dentro de las instalaciones (reporte global)
export async function getGlobalMaxTimeUser() {
  const rows = await db`
    WITH estadias_emparejadas AS (
        SELECT 
            user_id,
            zone_id,
            timestamp AS hora_entrada,
            LEAD(timestamp) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS hora_salida,
            log_type AS tipo_actual,
            LEAD(log_type) OVER (PARTITION BY user_id, zone_id ORDER BY timestamp) AS siguiente_tipo
        FROM access_logs
        WHERE granted = true
    )
    SELECT 
        u.name AS nombre_usuario,
        ROUND(EXTRACT(EPOCH FROM SUM(ee.hora_salida - ee.hora_entrada)) / 3600, 2)::float AS tiempo_total_horas
    FROM estadias_emparejadas ee
    JOIN users u ON ee.user_id = u.id
    WHERE ee.tipo_actual = 'Entrada' 
      AND ee.siguiente_tipo = 'Salida'
    GROUP BY u.id, u.name
    ORDER BY tiempo_total_horas DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

// Devuelve los nombres de las personas que registraron una entrada en una fecha específica
export async function getPeopleWhoWorkedByDate(dateStr: string) {
  return await db`
    SELECT DISTINCT u.name as "userName"
    FROM access_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.log_type = 'Entrada'
      AND al.granted = true
      AND DATE(al.timestamp) = ${dateStr}
  `;
}

//Te pasa todos los roles
export async function getAllRoles() {
  return await db`SELECT id, name FROM roles ORDER BY id ASC`;
}

//MODIFICA los roles del usuario
export async function updateUserRole(userId: number, roleId: number) {
  await db`UPDATE users SET role_id = ${roleId} WHERE id = ${userId}`;
}

// Devuelve la zona con más accesos concedidos en una fecha específica
export async function getBusiestZoneByDate(dateStr: string) {
  const rows = await db`
    SELECT z.name as "zoneName", COUNT(*)::int as "totalAccesses"
    FROM access_logs al
    JOIN zones z ON al.zone_id = z.id
    WHERE al.granted = true
      AND DATE(al.timestamp) = ${dateStr}
    GROUP BY z.name
    ORDER BY "totalAccesses" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// Devuelve la lista de correos de todos los usuarios registrados
export async function getAllEmails() {
  const rows = await db`SELECT email FROM users WHERE email IS NOT NULL`;
  return rows.map(r => r.email);
}
