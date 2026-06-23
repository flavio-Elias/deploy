//Se supone que bun ya ocupa un hash por defecto, asi que los hashees deberian coincidir
//Función para cuando alguien se registra o cambia su contraseña
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

//Función para cuando alguien intenta hacer Login
export async function verifyPassword(passwordPlana: string, hashGuardado: string): Promise<boolean> {
  return await Bun.password.verify(passwordPlana, hashGuardado);
}