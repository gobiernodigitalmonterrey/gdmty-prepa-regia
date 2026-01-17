import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function removeDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  // Find and delete duplicates, keeping the one with lowest ID
  const [result] = await connection.execute(`
    DELETE r1 FROM registros r1
    INNER JOIN registros r2
    WHERE r1.id > r2.id
      AND r1.nombre_completo = r2.nombre_completo
      AND r1.tipo = 'invitado'
      AND r2.tipo = 'invitado'
  `);

  console.log("Duplicates removed:", (result as any).affectedRows);

  await connection.end();
}

removeDuplicates().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
