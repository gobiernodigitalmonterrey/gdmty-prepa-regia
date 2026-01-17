import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database");

  // Create users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role ENUM('admin', 'usuario') DEFAULT 'usuario',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Users table created (or already exists)");

  // Add role column if it doesn't exist (for existing tables)
  try {
    await connection.execute(`
      ALTER TABLE users ADD COLUMN role ENUM('admin', 'usuario') DEFAULT 'usuario'
    `);
    console.log("Role column added to users table");
  } catch {
    // Column already exists, ignore
  }

  // Create registros table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS registros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_completo VARCHAR(255) NOT NULL,
      telefono VARCHAR(20),
      sede VARCHAR(255),
      invitados INT DEFAULT 0,
      fecha DATE,
      tipo ENUM('graduado', 'invitado') DEFAULT 'graduado',
      asistio BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Registros table created (or already exists)");

  // Add indexes for better search performance
  try {
    await connection.execute(`CREATE INDEX idx_registros_nombre ON registros(nombre_completo)`);
    console.log("Index on nombre_completo created");
  } catch {
    // Index already exists
  }

  try {
    await connection.execute(`CREATE INDEX idx_registros_sede ON registros(sede)`);
    console.log("Index on sede created");
  } catch {
    // Index already exists
  }

  try {
    await connection.execute(`CREATE INDEX idx_registros_telefono ON registros(telefono)`);
    console.log("Index on telefono created");
  } catch {
    // Index already exists
  }

  // Check if admin user exists
  const [existingUsers] = await connection.execute(
    "SELECT id FROM users WHERE email = ?",
    ["admin@prepa-regia.mx"]
  );

  if ((existingUsers as unknown[]).length > 0) {
    // Update existing admin user to have admin role
    await connection.execute(
      "UPDATE users SET role = 'admin' WHERE email = ?",
      ["admin@prepa-regia.mx"]
    );
    console.log("Admin user already exists, role updated to admin");
  } else {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await connection.execute(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["admin@prepa-regia.mx", hashedPassword, "Administrador", "admin"]
    );
    console.log("Admin user created:");
    console.log("  Email: admin@prepa-regia.mx");
    console.log("  Password: admin123");
    console.log("  Role: admin");
  }

  await connection.end();
  console.log("Seed completed successfully!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
