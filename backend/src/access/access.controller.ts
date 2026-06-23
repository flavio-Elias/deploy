import { issueAccessGrant, validateAccess } from "./access.service";
import { registerUser } from "../auth/auth.service";
import { getRecentAccessLogs, findUserByName, getAllZones, getPeopleWhoWorkedByDate, getBusiestZoneByDate  } from "./access.repository";
import { verifyPassword } from "../auth/auth.utils";
import { generateToken } from "../auth/jwt.utils";
import { 
  getUserAssistanceByDay, 
  getUserDistributionByHour, 
  getUserMostFrequentZone, 
  getUserTotalHours, 
  getUserAverageStayDuration,
  getGlobalMaxTimeUser 
} from "./access.repository";


// Controlador que valida la entrada y crea un permiso de acceso (grant) para un usuario en una zona
export async function createAccessGrantController(body: any) {

  if (typeof body.userId !== "number") {
    return {
      status: 400,
      body: { error: "userId must be a number" },
    };
  }

  if ( typeof body.zoneId !== "number") {
    return{
    status: 400,
    body: { error: "zoneId must be a number"},
    };
  }

  try {
    const grant = await issueAccessGrant({
      userId: body.userId,
      zoneId: body.zoneId,
      logType: body.logType === "Salida" ? "Salida" : "Entrada", // Default "Entrada""
    });

    return {
      status: 201,
      body: grant,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return {
        status: 404,
        body: { error: error.message },
      };
    }

    console.error("Error creating grant:", error);

    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}

// Controlador que devuelve la lista de zonas disponibles
export async function getZonesController() {
  try {
    const zones = await getAllZones();
    return { status: 200, body: zones };
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    return { status: 500, body: { error: "Error interno del servidor" } };
  }
}

// Controlador que valida la entrada y verifica un token de acceso (QR) contra una zona
export async function validateAccessController(body: any) {

  if (typeof body.token !== "string") {
    return {
      status: 400,
      body: { error: "token must be a string" },
    };
  }

  if (typeof body.zoneId !== "number") {
    return {
      status: 400,
      body: { error: "zoneId must be a number" },
    };
  }

  try {
    const result = await validateAccess({
      token: body.token,
      zoneId: body.zoneId,
      logType: body.logType || "Entrada",
    }as any);

    if (!result.ok) {
      return {
        status: result.reason === "not_found" ? 404 : 403,
        body: result,
      };
    }

    return {
      status: 200,
      body: result,
    };
  } catch (error) {
    console.error("Error validating access:", error);

    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}

// Controlador que valida los datos del formulario de registro y crea el usuario
export async function registerController(body: any) {
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return { status: 400, body: { error: "Fill all the fields" } };
  }

  try {
    const user = await registerUser(name, email, password);
    return { status: 201, body: { message: "Usuario creado con éxito", userId: user.id } };
  } catch (error: any) {
    return { status: 400, body: { error: error.message } };
  }
}

// Controlador que devuelve el historial de accesos más reciente
export async function getAccessLogsController() {
  try {
    const logs = await getRecentAccessLogs();
    
    return {
      status: 200,
      body: logs,
    };
  } catch (error) {
    console.error("Error fetching access logs:", error);
    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}

// Controlador de login con nombre de usuario y contraseña
export async function loginController(body: any) {
  const { name, password } = body;

  if (!name || !password) {
    return { status: 400, body: { error: "Faltan datos" } };
  }

  try {
    const user = await findUserByName(name);
    
    if (!user || !user.passw) {
      return { status: 401, body: { error: "Usuario o contraseña incorrecta" } };
    }

    const isValid = await verifyPassword(password, user.passw);
    if (!isValid) {
      return { status: 401, body: { error: "Usuario o contraseña incorrecta" } };
    }

    // Emitimos el JWT de sesión con los datos mínimos para autorizar futuras peticiones
    const token = generateToken({ userId: user.id, roleId: user.roleId, master: user.master });

    return {
      status: 200,
      body: {
        message: "Login exitoso",
        token,
        user: { id: user.id, name: user.name, email: user.email, roleId: user.roleId, master: user.master}
      }
    };
  } catch (error) {
    console.error("Error en login:", error);
    return { status: 500, body: { error: "Error interno del servidor" } };
  }
}

// Controlador que arma el reporte de métricas individuales de un usuario
export async function getUserReportController(userId: number) {
  try {
    const [dias, horasDist, zonaTop, totalHoras, promedioEstadia] = await Promise.all([
      getUserAssistanceByDay(userId),
      getUserDistributionByHour(userId),
      getUserMostFrequentZone(userId),
      getUserTotalHours(userId),
      getUserAverageStayDuration(userId)
    ]);

    return {
      status: 200,
      body: {
        userId,
        metrics: {
          totalHoras,
          promedioEstadiaMinutos: promedioEstadia,
          zonaMasFrecuente: zonaTop ? zonaTop.nombre_zona : "Ninguna",
          asistenciaPorDia: dias,
          distribucionHoraria: horasDist
        }
      }
    };
  } catch (error) {
    console.error("Error al generar reporte de usuario:", error);
    return { status: 500, body: { error: "Error interno al procesar las métricas" } };
  }
}

// Controlador que arma el reporte global (usuario con más horas acumuladas)
export async function getGlobalReportController() {
  try {
    const maxTimeUser = await getGlobalMaxTimeUser();
    return {
      status: 200,
      body: {
        usuarioMaxTiempo: maxTimeUser 
          ? { nombre: maxTimeUser.nombre_usuario, horas: maxTimeUser.tiempo_total_horas } 
          : null
      }
    };
  } catch (error) {
    console.error("Error al generar reporte global:", error);
    return { status: 500, body: { error: "Error interno al procesar el reporte global" } };
  }
}

// Controlador que arma el reporte de asistencia y zona más ocupada para una fecha específica
export async function getDateReportController(dateStr: string) {
  try {
    const [people, busyZone] = await Promise.all([
      getPeopleWhoWorkedByDate(dateStr),
      getBusiestZoneByDate(dateStr)
    ]);

    return {
      status: 200,
      body: {
        date: dateStr,
        asistencia: people.map(p => p.userName),
        zonaMasOcupada: busyZone ? busyZone.zoneName : "Ninguna"
      }
    };
  } catch (error) {
    console.error("Error al generar reporte por fecha:", error);
    return { status: 500, body: { error: "Error interno en métricas por fecha" } };
  }
}