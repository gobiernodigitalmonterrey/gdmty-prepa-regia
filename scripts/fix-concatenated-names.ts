import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Common Mexican first names to use as split points
const COMMON_FIRST_NAMES = [
  "AARON", "ABEL", "ABRAHAM", "ADAN", "ADRIAN", "AGUSTIN", "ALAN", "ALBERTO", "ALDO", "ALEJANDRA", "ALEJANDRO",
  "ALEX", "ALEXANDRA", "ALEXIS", "ALFONSO", "ALFREDO", "ALICIA", "ALMA", "ALONDRA", "ALVARO", "AMALIA", "AMANDA",
  "ANA", "ANDREA", "ANDRES", "ANGEL", "ANGELA", "ANGELICA", "ANGIE", "ANIBAL", "ANNA", "ANTONIO", "ARACELI",
  "ARIADNA", "ARIANA", "ARIANNA", "ARMANDO", "ARTURO", "ASHLEY", "AURORA", "AXEL", "BEATRIZ", "BELEN", "BENJAMIN",
  "BERENICE", "BERNARDO", "BLANCA", "BRANDON", "BRAYAN", "BRENDA", "BRIAN", "CAMILA", "CARLA", "CARLO", "CARLOS",
  "CARMEN", "CAROLINA", "CECILIA", "CESAR", "CHRISTIAN", "CHRISTOPHER", "CITLALI", "CLARA", "CLAUDIA", "CRISTIAN",
  "CRISTINA", "DANIEL", "DANIELA", "DANTE", "DARIO", "DAVID", "DIANA", "DIEGO", "DOLORES", "DOMINGO", "DULCE",
  "EDGAR", "EDITH", "EDMUNDO", "EDUARDO", "ELBA", "ELENA", "ELIAS", "ELISA", "ELIZABETH", "ELOISA", "ELSA",
  "EMANUEL", "EMILIA", "EMILIANO", "EMILIO", "EMMA", "EMMANUEL", "ENRIQUE", "ERICK", "ERIKA", "ERNESTO", "ESMERALDA",
  "ESPERANZA", "ESTEBAN", "ESTEFANIA", "ESTER", "ESTRELLA", "EVA", "EVELYN", "EZEQUIEL", "FABIAN", "FATIMA",
  "FEDERICO", "FELIPE", "FERNANDA", "FERNANDO", "FIDEL", "FLOR", "FLORA", "FRANCISCA", "FRANCISCO", "FRIDA",
  "GABRIEL", "GABRIELA", "GAEL", "GENESIS", "GERARDO", "GILBERTO", "GIOVANNA", "GIOVANNI", "GLORIA", "GONZALO",
  "GRACIELA", "GRISELDA", "GUADALUPE", "GUILLERMO", "GUSTAVO", "HECTOR", "HERIBERTO", "HERNAN", "HIRAM", "HUGO",
  "HUMBERTO", "IGNACIO", "ILSE", "IRENE", "IRIS", "IRMA", "ISAAC", "ISABEL", "ISIDRO", "ISMAEL", "ISRAEL", "ITZEL",
  "IVAN", "IVANA", "IVONNE", "JACQUELINE", "JAIME", "JANET", "JAQUELINE", "JAVIER", "JAZMIN", "JENNIFER", "JESSICA",
  "JESUS", "JIMENA", "JOAQUIN", "JOEL", "JOHAN", "JONATHAN", "JORGE", "JOSE", "JOSEFINA", "JOSUE", "JUAN", "JUANA",
  "JUDITH", "JULIA", "JULIAN", "JULIANA", "JULIETA", "JULIO", "KAREN", "KARINA", "KARLA", "KATIA", "KEVIN",
  "LAURA", "LAZARO", "LEONARDO", "LEONEL", "LETICIA", "LIDIA", "LILIA", "LILIANA", "LINDA", "LORENA", "LORENZO",
  "LOURDES", "LUCIA", "LUCIANA", "LUIS", "LUISA", "LUZ", "MAGDALENA", "MANUEL", "MANUELA", "MARCELA", "MARCO",
  "MARCOS", "MARGARITA", "MARIA", "MARIANA", "MARIELA", "MARIO", "MARISOL", "MARLENE", "MARTA", "MARTHA", "MARTIN",
  "MATEO", "MATIAS", "MAURICIO", "MAXIMO", "MAYRA", "MELISSA", "MERCEDES", "MICHELLE", "MIGUEL", "MIRIAM", "MOISES",
  "MONICA", "MONSERRAT", "NAHOMI", "NANCY", "NATALIA", "NATALY", "NAYELI", "NESTOR", "NICOLAS", "NOE", "NOEL",
  "NOEMI", "NORA", "NORMA", "OCTAVIO", "OFELIA", "OLGA", "OLIVER", "OLIVIA", "OMAR", "ORLANDO", "OSCAR", "OSVALDO",
  "PABLO", "PAMELA", "PAOLA", "PATRICIA", "PATRICIO", "PAULINA", "PEDRO", "PERLA", "PETRA", "PILAR", "PRISCILA",
  "RAFAEL", "RAMIRO", "RAMON", "RAQUEL", "RAUL", "REBECA", "REGINA", "RENATA", "RENE", "REYNA", "RICARDO", "RIGOBERTO",
  "RITA", "ROBERTO", "ROCIO", "RODOLFO", "RODRIGO", "ROGELIO", "ROSA", "ROSALIA", "ROSARIO", "ROXANA", "RUBEN",
  "RUTH", "SABRINA", "SAID", "SALMA", "SALVADOR", "SAMANTHA", "SAMUEL", "SANDRA", "SANTIAGO", "SARA", "SAUL",
  "SEBASTIAN", "SELENE", "SERGIO", "SILVIA", "SIMON", "SOFIA", "SONIA", "SUSANA", "TANIA", "TERESA", "TOMAS",
  "URIEL", "VALERIA", "VANESSA", "VERONICA", "VICENTE", "VICTOR", "VICTORIA", "VIOLETA", "VIRGINIA", "VIVIANA",
  "WENDY", "XIMENA", "YOLANDA", "YOSHUA", "ZARA", "ZOILA", "ALDAIR", "JONAS", "NAHOMI", "BENJAMÍN", "CÉSAR",
  "AARÓN", "ADRIÁN", "AGUSTÍN", "ANDRÉS", "ÁNGEL", "ANGÉLICA", "ANÍBAL", "BENJAMÍN", "CECÍLIA", "CÉSAR", "CRISTIÁN",
  "DARÍO", "ELÍAS", "FERNÁN", "HERNÁN", "JOAQUÍN", "JULIÁN", "LÁZARO", "MARÍA", "MÁXIMO", "MOISÉS", "MÓNICA",
  "NÉSTOR", "NICOLÁS", "NOÉ", "ÓSCAR", "RAMÓN", "RAÚL", "RENÉ", "SEBASTIÁN", "SIMÓN", "TOMÁS", "VÍCTOR"
];

// Create a Set for faster lookup
const firstNamesSet = new Set(COMMON_FIRST_NAMES);

function splitConcatenatedNames(fullName: string): string[] {
  const words = fullName.split(/\s+/);

  if (words.length <= 4) {
    // Normal name length, don't split
    return [fullName];
  }

  const names: string[] = [];
  let currentName: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if this word is a common first name AND we already have at least 3 words
    // (meaning we likely have a complete name: NOMBRE APELLIDO1 APELLIDO2)
    if (firstNamesSet.has(word) && currentName.length >= 3) {
      // Save current name and start new one
      names.push(currentName.join(" "));
      currentName = [word];
    } else {
      currentName.push(word);
    }
  }

  // Don't forget the last name
  if (currentName.length > 0) {
    names.push(currentName.join(" "));
  }

  // Filter out names that are too short (less than 2 words)
  return names.filter(name => name.split(/\s+/).length >= 2);
}

async function fixConcatenatedNames() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  // Find invitados with very long names (likely concatenated)
  const [rows] = await connection.execute<any[]>(`
    SELECT id, nombre_completo, telefono
    FROM registros
    WHERE tipo = 'invitado'
      AND LENGTH(nombre_completo) - LENGTH(REPLACE(nombre_completo, ' ', '')) >= 5
    ORDER BY id
  `);

  console.log(`Found ${rows.length} records with potentially concatenated names`);

  let fixed = 0;
  let newRecords = 0;

  for (const row of rows) {
    const splitNames = splitConcatenatedNames(row.nombre_completo);

    if (splitNames.length > 1) {
      console.log(`\nOriginal: ${row.nombre_completo}`);
      console.log(`Split into ${splitNames.length} names:`);
      splitNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));

      // Update first record with first name
      await connection.execute(
        "UPDATE registros SET nombre_completo = ? WHERE id = ?",
        [splitNames[0], row.id]
      );

      // Insert remaining names as new records
      for (let i = 1; i < splitNames.length; i++) {
        await connection.execute(
          "INSERT INTO registros (nombre_completo, telefono, sede, tipo, asistio) VALUES (?, ?, NULL, 'invitado', FALSE)",
          [splitNames[i], null]
        );
        newRecords++;
      }

      fixed++;
    }
  }

  console.log(`\n\nFixed ${fixed} concatenated records`);
  console.log(`Created ${newRecords} new records`);

  // Remove duplicates that may have been created
  const [dupResult] = await connection.execute(`
    DELETE r1 FROM registros r1
    INNER JOIN registros r2
    WHERE r1.id > r2.id
      AND r1.nombre_completo = r2.nombre_completo
      AND r1.tipo = 'invitado'
      AND r2.tipo = 'invitado'
  `);

  console.log(`Removed ${(dupResult as any).affectedRows} duplicates`);

  await connection.end();
}

fixConcatenatedNames().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
