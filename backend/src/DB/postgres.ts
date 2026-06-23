import postgres from "postgres";

// Verificamos que el link exista, si no, el servidor se detiene y avisa
if (!Bun.env.DATABASE_URL) {
  throw new Error("Falta la variable DATABASE_URL en el archivo .env");
}

// Inicializamos la conexión hacia tu contenedor de Docker
export const db = postgres(Bun.env.DATABASE_URL);
