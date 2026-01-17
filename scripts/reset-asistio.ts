import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function resetAsistio() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.execute("UPDATE registros SET asistio = FALSE");

  console.log("All registros set to asistio = FALSE");

  await connection.end();
}

resetAsistio().catch(console.error);
