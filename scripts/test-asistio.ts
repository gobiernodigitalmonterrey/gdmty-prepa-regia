import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function updateAsistio() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Set 160 random registros to asistio = true
  await connection.execute(`
    UPDATE registros SET asistio = TRUE
    WHERE id IN (
      SELECT id FROM (
        SELECT id FROM registros WHERE asistio = FALSE ORDER BY RAND() LIMIT 160
      ) as tmp
    )
  `);

  console.log("Updated 160 registros to asistio = TRUE");

  // Check count
  const [rows] = await connection.execute<any[]>(
    "SELECT COUNT(*) as count FROM registros WHERE asistio = TRUE"
  );
  console.log("Total asistieron:", rows[0].count);

  await connection.end();
}

updateAsistio().catch(console.error);
