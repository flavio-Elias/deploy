import crypto from "crypto";
import type {
  AccessGrant,
  AccessValidationResult,
  CreateAccessGrantRequest,
  ValidateAccessInput,
} from "./access.types";

import {
  findUserById,
  findZoneById,
  findGrantByToken,
  createGrant,
  markGrantAsUsed,
  roleHasZonePermission,
  createAccessLog,
  isUserBannedFromZone,
} from "./access.repository";

// tiempo de vida de los token (Tranquilein john wayne, despues es multiplicado por un factor de 1000)
export const DEFAULT_TTL_SECONDS = 300;

// funcion que crea un token de acceso aleatorio
function generateAccessToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// Función para validar un token de acceso
export async function issueAccessGrant(
  input: CreateAccessGrantRequest
): Promise<AccessGrant> {
  const user = await findUserById(input.userId);

  if (!user) {
    throw new Error("User not found");
  }

  const ttlSeconds = DEFAULT_TTL_SECONDS;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);
  const token = generateAccessToken();

  // se crea el registro del token en la base de datos
  const grant = await createGrant({
    userId: input.userId, 
    zoneId: input.zoneId,
    logType: input.logType,
    token,
    issuedAt,
    expiresAt,
    status: "active",
  });

  return grant;
}


//Funcion que decide si se concede o no el acceso a una zona determinada

export async function validateAccess(
  input: ValidateAccessInput & { logType? : string } //tbh no se muy bien que hace esto
): Promise<AccessValidationResult> {                 //R: Le añade la propiedad de logtype :)
  const grant = await findGrantByToken(input.token);

  if (!grant) {
    return { ok: false, reason: "not_found" };
  }

  if (grant.status === "used") {
    await createAccessLog({
      userId: grant.userId,
      zoneId: input.zoneId,
      logType: (input.logType || "Entrada") as "Entrada" | "Salida",
      accessMethod: "QR",
      granted: false,
    });

    return { ok: false, reason: "used" };
  }

  if (grant.status === "revoked") {
    await createAccessLog({
      userId: grant.userId,
      zoneId: input.zoneId,
      logType: (input.logType || "Entrada") as "Entrada" | "Salida",
      accessMethod: "QR",
      granted: false,
    });

    return { ok: false, reason: "revoked" };
  }

  const now = new Date();

  if (grant.expiresAt.getTime() < now.getTime()) {
    await createAccessLog({
      userId: grant.userId,
      zoneId: input.zoneId,
      logType: (input.logType || "Entrada") as "Entrada" | "Salida",     
      accessMethod: "QR",
      granted: false,
    });

    return { ok: false, reason: "expired" };
  }

  const zone = await findZoneById(input.zoneId);

  if (!zone) {
    return { ok: false, reason: "unauthorized_zone" };
  }

  const user = await findUserById(grant.userId);

  if (!user) {
    return { ok: false, reason: "not_found" };
  }

  const isBanned = await isUserBannedFromZone(user.id, input.zoneId);
  
  if (isBanned) {
    await createAccessLog({
      userId: grant.userId,
      zoneId: input.zoneId,
      logType: (input.logType || "Entrada") as "Entrada" | "Salida",
      accessMethod: "QR",
      granted: false,
    });
    return { ok: false, reason: "unauthorized_zone" }; 
  }
  
  const hasPermission = await roleHasZonePermission(user.roleId, input.zoneId);

  if (!hasPermission) {
    await createAccessLog({
      userId: grant.userId,
      zoneId: input.zoneId,
      logType: (input.logType || "Entrada") as "Entrada" | "Salida",
      accessMethod: "QR",
      granted: false,
    });

    return { ok: false, reason: "unauthorized_zone" };
  }

  await markGrantAsUsed(grant.id);

  await createAccessLog({
    userId: grant.userId,
    zoneId: input.zoneId,
    logType: (input.logType || "Entrada") as "Entrada" | "Salida",
    accessMethod: "QR",
    granted: true,
  });

  return { ok: true };
}