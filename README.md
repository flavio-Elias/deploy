# ReconocimientoFacialLAB

"bun --env-file=.env run backend/src/index.ts" para correr el index en mi caso (Looff)


//poner en la consola
fetch("http://localhost:3000/api/validate-access", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    token: "El token que se haya generado",
    zoneId: 2,
  }),
})
.then(async (res) => {
  const text = await res.text();
  console.log("status:", res.status);
  console.log("respuesta cruda:", text);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("La respuesta no es JSON (seguro es un 404 o error HTML)");
  }
})
.then(data => console.log("JSON:", data))
.catch(err => console.error("ERROR:", err.message));