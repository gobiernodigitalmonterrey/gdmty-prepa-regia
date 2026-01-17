import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

interface ParsedPerson {
  nombre: string;
  telefono: string | null;
}

function extractPhone(text: string): { phone: string | null; remaining: string } {
  // Pattern to match phone numbers in various formats
  // +52 81 1234 5678, 81 1234 5678, 8112345678, Tel: 8112345678, etc.
  const phonePatterns = [
    /\+52\s*(\d[\d\s\.\-]*)/,
    /Tel:\s*(\d[\d\s\.\-]*)/i,
    /(\d{10,})/,
    /(\d{2,4}[\s\.\-]\d{2,4}[\s\.\-]?\d{2,4}[\s\.\-]?\d{0,4})/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract just the digits
      const digits = match[0].replace(/\D/g, "");
      // Mexican phones are 10 digits, or 12 with +52
      if (digits.length >= 10) {
        const phone = digits.slice(-10); // Take last 10 digits
        const remaining = text.replace(match[0], "").trim();
        return { phone, remaining };
      }
    }
  }

  return { phone: null, remaining: text };
}

function parsePeople(cellContent: string): ParsedPerson[] {
  const people: ParsedPerson[] = [];

  // First, normalize the content - replace various separators with newlines
  let normalized = cellContent
    // Split on comma followed by space and uppercase letter (new person)
    .replace(/,\s+([A-ZÁÉÍÓÚÑÜ])/g, "\n$1")
    // Split on TEL or Tel followed by content
    .replace(/\s+TEL[:\s]+/gi, " TEL:")
    // Normalize multiple spaces
    .replace(/\s{2,}/g, " ");

  // Split by newlines
  const lines = normalized
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let pendingName: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if line is just a phone number
    const digitsOnly = line.replace(/\D/g, "");
    if (digitsOnly.length >= 10 && line.replace(/[\d\s\.\-\+\(\)]/g, "").length < 5) {
      // This is primarily a phone number
      if (pendingName) {
        people.push({
          nombre: pendingName.toUpperCase().substring(0, 250),
          telefono: digitsOnly.slice(-10),
        });
        pendingName = null;
      }
      continue;
    }

    // Try to extract phone from line
    const { phone, remaining } = extractPhone(line);

    // Clean remaining text
    const cleanName = remaining
      .replace(/TEL:?\s*/gi, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanName.length > 3) {
      // Has a name
      if (pendingName) {
        // Save previous name without phone
        people.push({
          nombre: pendingName.toUpperCase().substring(0, 250),
          telefono: null,
        });
      }

      if (phone) {
        people.push({
          nombre: cleanName.toUpperCase().substring(0, 250),
          telefono: phone,
        });
        pendingName = null;
      } else {
        pendingName = cleanName;
      }
    } else if (phone && pendingName) {
      // Line is mostly phone, attach to pending name
      people.push({
        nombre: pendingName.toUpperCase().substring(0, 250),
        telefono: phone,
      });
      pendingName = null;
    }
  }

  // Don't forget last pending name
  if (pendingName && pendingName.length > 3) {
    people.push({
      nombre: pendingName.toUpperCase().substring(0, 250),
      telefono: null,
    });
  }

  return people;
}

function parseCSV(content: string): string[] {
  const cells: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        if (char === "\r") i++;
        if (currentCell.trim()) {
          cells.push(currentCell.trim());
        }
        currentCell = "";
      } else if (char !== "\r") {
        currentCell += char;
      }
    }
  }

  if (currentCell.trim()) {
    cells.push(currentCell.trim());
  }

  return cells;
}

async function importInvitados() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  const csvPath = path.join(process.cwd(), "public", "invitados_.csv");
  // Read as latin1 (Windows encoding) and convert to proper UTF-8
  const csvContent = fs.readFileSync(csvPath, "latin1").replace(/^\uFEFF/, "");

  const cells = parseCSV(csvContent);

  // Skip header
  const dataCells = cells.slice(1);

  console.log(`Found ${dataCells.length} cells to process`);

  let imported = 0;
  let totalPeople = 0;

  for (const cell of dataCells) {
    const people = parsePeople(cell);
    totalPeople += people.length;

    for (const person of people) {
      if (person.nombre.length < 3) continue;

      try {
        await connection.execute(
          "INSERT INTO registros (nombre_completo, telefono, sede, tipo, asistio) VALUES (?, ?, ?, 'invitado', FALSE)",
          [person.nombre, person.telefono, null]
        );
        imported++;
      } catch (error) {
        console.error(`Error importing: ${person.nombre}`, error);
      }
    }
  }

  console.log(`Processed ${dataCells.length} cells, found ${totalPeople} people`);
  console.log(`Import completed: ${imported} invitados imported`);

  await connection.end();
}

importInvitados().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
