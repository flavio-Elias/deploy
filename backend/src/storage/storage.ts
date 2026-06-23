import { Client } from "minio";
import { decrypt, encrypt } from "./cryptor"
const BUCKET = "face-snapshots";

const client = new Client({
  endPoint: Bun.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(Bun.env.MINIO_PORT || 9000),
  useSSL: false,
  accessKey: Bun.env.MINIO_ROOT_USER ?? "",
  secretKey: Bun.env.MINIO_ROOT_PASSWORD ?? "",
});
//Usaremos esta funcion (initStorage) junto con saveSnapshot en los otros archivos
export async function initStorage() {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
    console.log(`Bucket '${BUCKET}' creado`);
  }
}

// Guarda una imagen y devuelve su ruta
export async function saveSnapshot(
  imageBuffer: Buffer,
  userId: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg"
): Promise<{ filePath: string; iv: string }> {
  const timestamp = Date.now();
  const ext = mimeType === "image/png" ? "png" : "jpg";
  const fileName = `${userId}/${timestamp}.${ext}`;

  const { encrypted, iv } = encrypt(imageBuffer);

  await client.putObject(BUCKET, fileName, encrypted, encrypted.length, {
    "Content-Type": mimeType,
  });

  return { filePath: fileName, iv }; // guarda el vector de inicializacion(iv)
}

// Guarda el embedding de un usuario como JSON en MinIO
export async function saveEmbedding(
    userId: string,
    embedding: number[]
): Promise<{ filePath: string; iv: string }> {
    const timestamp = Date.now()
    // Guardamos el embedding en una carpeta por usuario
    const fileName = `${userId}/embedding_${timestamp}.json`
    const buffer = Buffer.from(JSON.stringify(embedding))
    const { encrypted, iv } = encrypt(buffer)

    await client.putObject(BUCKET, fileName, encrypted, encrypted.length, {
        "Content-Type": "application/json",
    })

    return { filePath: fileName, iv }
}


//Nota de Xx_flavitogamer_xX: para usarlo no olviden importar ambas funciones 
//Nota de Xx_IvanzinsuTHEKILLER_xX: ¿y si no quiero, waton? q pasa po
//Nota de Xx_Luffe_xX: no pasa nada, pero si quieres guardar las imagenes en el minio, vas a tener que usar estas funciones, eso pasa po xd