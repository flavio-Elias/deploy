import { initStorage, saveEmbedding, saveSnapshot } from "./storage/storage"
import { validateAccessController, registerController,  getAccessLogsController, loginController, getZonesController, getUserReportController, getGlobalReportController } from "./access/access.controller"
import { saveFaceSnapshot, findOrCreateGoogleUser, findNearestFaceMatch, createAccessLog, findUserByEmail, findUserById, roleHasZonePermission } from "./access/access.repository"
import { requestOtp, verifyOtp } from "./otp/otp.service"
import { emitirYEnviarQR } from "./qr/qr.services";
import { generateToken, getAuthFromRequest, isAdmin } from "./auth/jwt.utils";

await initStorage()

// Cabeceras CORS comunes para permitir que el frontend (en otro origen) llame a esta API
function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
}

// Respuesta estándar cuando no se envió un token válido en el header Authorization
function unauthorized() {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: corsHeaders() });
}

// Respuesta estándar cuando el token es válido pero el usuario no tiene privilegios de administrador
function forbidden() {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403, headers: corsHeaders() });
}

//Para probar el envio de QR (pueden cambiar el correo si lo quieren probar)


Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url)

        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders() })
        }

        // Login con nombre de usuario y contraseña
        if (req.method === "POST" && url.pathname === "/api/login") {
            try {
                const body = await req.json();
                const result = await loginController(body);
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
            }
        }

        // Genera y envía por correo un QR de acceso para un usuario y zona específicos
        if (req.method === "POST" && url.pathname === "/api/qr/request") {
            try {
                const { email, zoneId, logType = "Entrada" } = await req.json();
                
                const user = await findUserByEmail(email);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Correo no encontrado en base de datos" }), { status: 404, headers: corsHeaders() });
                }
                const hasAccess = await roleHasZonePermission(user.roleId, zoneId);
                
                if (!hasAccess) {
                    return new Response(JSON.stringify({ error: "No tiene autorización para pasar" }), { status: 403, headers: corsHeaders() });
                }

                await emitirYEnviarQR(user.id, zoneId, logType, email);
                return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
            }
        }

        // Registro de un nuevo usuario con nombre, correo y contraseña
        if (req.method === "POST" && url.pathname === "/api/register") {
            try {
                const body = await req.json()
                const result = await registerController(body)
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            } catch {
                return new Response(JSON.stringify({ error: "Invalid request" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // Valida un token de QR escaneado contra una zona y registra el acceso
        if (req.method === "POST" && url.pathname === "/api/validate-access") { //Ruta de validacion QR
            try {
                const body = await req.json()
                const result = await validateAccessController(body)
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            } catch {
                return new Response(JSON.stringify({ error: "Invalid request" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // Recibe un embedding facial desde la cámara, busca la coincidencia más cercana y valida el acceso a la zona
        if (req.method === "POST" && url.pathname === "/api/face-recognize") {
            try {
                const { embedding, zoneId, logType = "Entrada"} = await req.json()
                if (!Array.isArray(embedding)) {
                    return new Response(JSON.stringify({ error: "embedding requerido" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                const match = await findNearestFaceMatch(embedding)
                if (!match) {
                    return new Response(JSON.stringify({ ok: false, reason: "no_match" }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }

 // 1. Buscamos al usuario COMPLETO aquí afuera para que sirva con o sin zoneId
                const user = await findUserById(match.userId)
                if (!user) {
                    return new Response(JSON.stringify({ ok: false, reason: "user_not_found" }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }

                // 2. Ahora validaremos con los permisos SÓLO si viene un zoneId
                if (zoneId) {
                    const { roleHasZonePermission, isUserBannedFromZone } = await import("./access/access.repository");
                    
                    const isBanned = await isUserBannedFromZone(user.id, zoneId);
                    
                    if (isBanned) {
                        await createAccessLog({
                            userId: match.userId,
                            zoneId,
                            logType: (logType || "Entrada") as "Entrada" | "Salida",
                            accessMethod: "CARA",
                            granted: false,
                        });
                        return new Response(JSON.stringify({ ok: false, reason: "unauthorized_zone" }), {
                            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() },
                        });
                    }

                    // Evaluamos si su rol cuenta con pases autorizados
                    const hasPermission = await roleHasZonePermission(user.roleId, zoneId)
                    
                    if (!hasPermission) {
                        await createAccessLog({
                            userId: match.userId,
                            zoneId,
                            logType: logType,
                            accessMethod: "CARA",
                            granted: false,
                        })

                        return new Response(JSON.stringify({ ok: false, reason: "unauthorized_zone" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...corsHeaders() },
                        })
                    }

                    // Si tiene autorización legítima, registramos el éxito
                    await createAccessLog({
                        userId: match.userId,
                        zoneId,
                        logType: logType,
                        accessMethod: "CARA",
                        granted: true,
                    })
                }

                // 3. Respuesta final (¡Ahora incluye 'master' y 'roleId' para el login inicial!)
                const faceSessionToken = generateToken({ userId: user.id, roleId: user.roleId, master: user.master })
                return new Response(JSON.stringify({
                    ok: true,
                    token: faceSessionToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        roleId: user.roleId,
                        master: user.master // <-- ESTO ES LO QUE FALTA
                    },
                    distance: match.distance,
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
                
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message ?? "Error en reconocimiento" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // ADMIN: banea o desbanea a un usuario de una zona específica
        if (req.method === "POST" && url.pathname === "/api/admin/toggle-ban") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const { userId, zoneId, ban } = await req.json();
                if (!userId || !zoneId || typeof ban !== 'boolean') {
                    return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400, headers: corsHeaders() });
                }

                const { toggleUserZoneBan } = await import("./access/access.repository");
                await toggleUserZoneBan(userId, zoneId, ban);
                
                return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
            } catch (err) {
                return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: corsHeaders() });
            }
        }

        // ENDPOINT: MASTER - BORRAR BIOMETRÍA
        if (req.method === "POST" && url.pathname === "/api/admin/delete-biometrics") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const { userId } = await req.json();
                if (!userId) return new Response(JSON.stringify({ error: "Falta userId" }), { status: 400, headers: corsHeaders() });
                
                const { deleteBiometrics } = await import("./access/access.repository");
                await deleteBiometrics(userId);
                
                return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
            } catch (err) {
                return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: corsHeaders() });
            }
        }

        // ADMIN: lista todos los usuarios (activos e inactivos) para el panel de administración
        if (req.method === "GET" && url.pathname === "/api/admin/users") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const { getAllUsers } = await import("./access/access.repository");
                const users = await getAllUsers();
                return new Response(JSON.stringify(users), { status: 200, headers: corsHeaders() });
            } catch (err) {
                return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: corsHeaders() });
            }
        }

        // ADMIN: activa o desactiva la cuenta de un usuario
        if (req.method === "POST" && url.pathname === "/api/admin/toggle-user") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const { userId, isActive } = await req.json();
                if (!userId || typeof isActive !== 'boolean') {
                    return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400, headers: corsHeaders() });
                }

                const { toggleUserStatus } = await import("./access/access.repository");
                await toggleUserStatus(userId, isActive);
                
                return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
            } catch (err) {
                return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: corsHeaders() });
            }
        }

        // Guarda el embedding facial de un usuario (cifrado) en el almacenamiento de objetos
        if (req.method === "POST" && url.pathname === "/api/embedding") {
            const { userId, embedding } = await req.json()
            if (!userId || !Array.isArray(embedding)) {
                return new Response(JSON.stringify({ error: "userId and embedding are required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
            const { filePath, iv } = await saveEmbedding(userId, embedding)
            return new Response(JSON.stringify({ ok: true, filePath, iv }), {
                status: 201,
                headers: { "Content-Type": "application/json", ...corsHeaders() },
            })
        }

        // Guarda la foto de rostro (cifrada) junto con su embedding, asociada a un usuario
        if (req.method === "POST" && url.pathname === "/api/face-snapshot") {
            const { userId, imageBase64, mimeType, embedding } = await req.json()
            if (!userId || !imageBase64 || !Array.isArray(embedding)) {
                return new Response(JSON.stringify({ error: "userId, imageBase64 and embedding are required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
            const buffer = Buffer.from(imageBase64, "base64")
            const { filePath, iv } = await saveSnapshot(buffer, String(userId), mimeType ?? "image/jpeg")
            await saveFaceSnapshot({ userId: Number(userId), filePath, iv, embedding })
            return new Response(JSON.stringify({ ok: true, filePath }), {
                status: 201,
                headers: { "Content-Type": "application/json", ...corsHeaders() },
            })
        }

        // Login con Google: verifica el ID token contra Google y crea/recupera al usuario por correo
        if (req.method === "POST" && url.pathname === "/api/auth/google") {
            try {
                const { token } = await req.json()
                if (!token) {
                    return new Response(JSON.stringify({ error: "Token requerido" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                // Verify the ID token with Google's public endpoint
                const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
                if (!googleRes.ok) {
                    return new Response(JSON.stringify({ error: "Token de Google inválido" }), {
                        status: 401,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                const payload = await googleRes.json() as { email: string; name: string; aud: string }
                if (payload.aud !== Bun.env.GOOGLE_CLIENT_ID) {
                    return new Response(JSON.stringify({ error: "Token no pertenece a esta aplicación" }), {
                        status: 401,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                const user = await findOrCreateGoogleUser(payload.email, payload.name)
                const sessionToken = generateToken({ userId: user.id, roleId: user.roleId, master: user.master })
                // No devolvemos el hash de la contraseña (passw) al frontend
                const safeUser = { id: user.id, name: user.name, email: user.email, roleId: user.roleId, master: user.master }
                return new Response(JSON.stringify({ ok: true, token: sessionToken, user: safeUser }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message ?? "Error en autenticación Google" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // Solicita el envío de un código OTP de un solo uso al correo indicado
        if (req.method === "POST" && url.pathname === "/api/auth/otp/request") {
            try {
                const { email } = await req.json()
                if (!email) {
                    return new Response(JSON.stringify({ error: "El correo es requerido" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                const result = await requestOtp(email)
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message ?? "Error al enviar el código" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // Verifica el código OTP enviado y completa el login por correo
        if (req.method === "POST" && url.pathname === "/api/auth/otp/verify") {
            try {
                const { email, code } = await req.json()
                if (!email || !code) {
                    return new Response(JSON.stringify({ error: "Correo y código son requeridos" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...corsHeaders() },
                    })
                }
                const result = await verifyOtp(email, code)
                // Sólo emitimos JWT si el correo corresponde a un usuario real (con id) en la base de datos
                const sessionToken = result.user.id !== null
                    ? generateToken({ userId: result.user.id, roleId: result.user.roleId, master: result.user.master })
                    : null
                return new Response(JSON.stringify({ ...result, token: sessionToken }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message ?? "Error al verificar el código" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                })
            }
        }

        // Reporte de métricas de un usuario específico, buscado por correo
        if (req.method === "GET" && url.pathname === "/api/reports/user") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const emailParam = url.searchParams.get("email");
                if (!emailParam) {
                    return new Response(JSON.stringify({ error: "Correo electrónico requerido" }), { status: 400, headers: corsHeaders() });
                }

                const { findUserByEmail } = await import("./access/access.repository");
                const user = await findUserByEmail(emailParam);

                if (!user) {
                    return new Response(JSON.stringify({ error: "Correo no encontrado en la base de datos" }), { status: 404, headers: corsHeaders() });
                }
                
                // Si existe, pasamos su ID al controlador
                const result = await getUserReportController(user.id);
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                });
            } catch {
                return new Response(JSON.stringify({ error: "Error interno en la solicitud" }), { status: 500, headers: corsHeaders() });
            }
        }

        // Reporte global: usuario con más horas acumuladas en las instalaciones
        if (req.method === "GET" && url.pathname === "/api/reports/global") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const result = await getGlobalReportController();
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                });
            } catch {
                return new Response(JSON.stringify({ error: "Invalid request" }), { status: 500, headers: corsHeaders() });
            }
        }

        // ENDPOINT: Obtener lista de roles disponibles
        if (req.method === "GET" && url.pathname === "/api/roles") {
            try {
                const { getAllRoles } = await import("./access/access.repository");
                const roles = await getAllRoles();
                return new Response(JSON.stringify(roles), { status: 200, headers: corsHeaders() });
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
            }
        }

        // ENDPOINT: Asignar el nuevo rol y refrescar el JWT
        if (req.method === "POST" && url.pathname === "/api/users/role") {
            try {
                const { userId, roleId } = await req.json();
                if (!userId || !roleId) return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400, headers: corsHeaders() });

                const { updateUserRole, findUserById } = await import("./access/access.repository");
                const { generateToken } = await import("./auth/jwt.utils");

                await updateUserRole(userId, roleId);
                const user = await findUserById(userId);

                if (!user) return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404, headers: corsHeaders() });

                // Se emite el nuevo token con el rol actualizado
                const token = generateToken({ userId: user.id, roleId: user.roleId, master: user.master });

                return new Response(JSON.stringify({
                    ok: true,
                    token: token,
                    user: { id: user.id, name: user.name, email: user.email, roleId: user.roleId, master: user.master }
                }), { status: 200, headers: corsHeaders() });

            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
            }
        }

        // Reporte de asistencia y zona más ocupada para una fecha específica
        if (req.method === "GET" && url.pathname === "/api/reports/date") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const dateParam = url.searchParams.get("date"); // Espera formato YYYY-MM-DD
                if (!dateParam) {
                    return new Response(JSON.stringify({ error: "Parámetro 'date' requerido" }), { status: 400, headers: corsHeaders() });
                }
                
                const { getDateReportController } = await import("./access/access.controller");
                const result = await getDateReportController(dateParam);
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                });
            } catch {
                return new Response(JSON.stringify({ error: "Invalid request" }), { status: 500, headers: corsHeaders() });
            }
        }

        // Lista todos los correos registrados (usado para autocompletar en el buscador de reportes)
        if (req.method === "GET" && url.pathname === "/api/users/emails") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const { getAllEmails } = await import("./access/access.repository");
                const emails = await getAllEmails();
                return new Response(JSON.stringify(emails), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json", ...corsHeaders() } 
                });
            } catch {
                return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: corsHeaders() });
            }
        }

        // Devuelve el historial de accesos más reciente (últimos 50 registros)
        if (req.method === "GET" && url.pathname === "/api/logs") {
            const auth = getAuthFromRequest(req);
            if (!auth) return unauthorized();
            if (!isAdmin(auth)) return forbidden();
            try {
                const result = await getAccessLogsController();
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*", //Tuve problmas con los permsisos asi que le di todo no mas
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type"
                    },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Invalid request" }), { 
                status: 500,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                }
            });
        }
    }

        // Lista todas las zonas registradas
        if (req.method === "GET" && url.pathname === "/api/zones") {
            try {
                const result = await getZonesController();
                return new Response(JSON.stringify(result.body), {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() },
                });
            } catch {
                return new Response(JSON.stringify({ error: "Invalid request" }), {
                    status: 500,
                    headers: corsHeaders(),
                });
            }
        }

        return new Response("Not found", { status: 404, headers: corsHeaders() })
    },
})

console.log("Server running on http://localhost:3000")
