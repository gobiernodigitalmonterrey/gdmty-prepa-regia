import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function parseDate(dateStr: string): string | null {
  // Format: DD/MM/YY
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;

  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  let year = parts[2];

  // Convert 2-digit year to 4-digit
  if (year.length === 2) {
    const yearNum = parseInt(year, 10);
    year = yearNum >= 50 ? `19${year}` : `20${year}`;
  }

  return `${year}-${month}-${day}`;
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        insideQuotes = true;
      } else if (char === ",") {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // Row separator
        if (char === "\r") i++; // Skip \n in \r\n
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function importCSV() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  const csvPath = path.join(process.cwd(), "public", "registro.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");

  const rows = parseCSV(csvContent);

  // Skip header
  const dataRows = rows.slice(1);

  console.log(`Found ${dataRows.length} records to import`);

  // Clear existing records
  await connection.execute("DELETE FROM registros");
  console.log("Cleared existing records");

  let imported = 0;
  let errors = 0;

  for (const row of dataRows) {
    if (row.length < 5) {
      console.log(`Skipping invalid row (${row.length} fields): ${row.join(", ")}`);
      errors++;
      continue;
    }

    const [nombreCompleto, telefono, sede, invitadosStr, fechaStr] = row;
    const invitados = parseInt(invitadosStr, 10) || 0;
    const fecha = parseDate(fechaStr);

    // Clean up name (remove extra whitespace/newlines) and convert to uppercase
    const cleanName = nombreCompleto.replace(/\s+/g, " ").trim().toUpperCase();
    const cleanSede = sede.toUpperCase();

    try {
      await connection.execute(
        "INSERT INTO registros (nombre_completo, telefono, sede, invitados, fecha, tipo) VALUES (?, ?, ?, ?, ?, 'graduado')",
        [cleanName, telefono, cleanSede, invitados, fecha]
      );
      imported++;
    } catch (error) {
      console.error(`Error importing: ${cleanName}`, error);
      errors++;
    }
  }

  console.log(`Import completed: ${imported} records imported, ${errors} errors`);

  await connection.end();
}

importCSV().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
