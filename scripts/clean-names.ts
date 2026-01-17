import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function cleanNames() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  // Get all invitados with numbers in their names
  const [rows] = await connection.execute<any[]>(`
    SELECT id, nombre_completo
    FROM registros
    WHERE tipo = 'invitado'
      AND nombre_completo REGEXP '[0-9]'
  `);

  console.log(`Found ${rows.length} records with numbers in names`);

  let cleaned = 0;

  for (const row of rows) {
    // Remove numbers, extra dots, commas, and clean up spaces
    const cleanName = row.nombre_completo
      .replace(/[0-9]/g, "")           // Remove digits
      .replace(/\s*[.,;:]+\s*/g, " ")  // Remove punctuation
      .replace(/\s+/g, " ")            // Normalize spaces
      .trim();

    if (cleanName !== row.nombre_completo && cleanName.length >= 3) {
      await connection.execute(
        "UPDATE registros SET nombre_completo = ? WHERE id = ?",
        [cleanName, row.id]
      );
      console.log(`${row.nombre_completo} -> ${cleanName}`);
      cleaned++;
    }
  }

  console.log(`\nCleaned ${cleaned} records`);

  await connection.end();
}

cleanNames().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
