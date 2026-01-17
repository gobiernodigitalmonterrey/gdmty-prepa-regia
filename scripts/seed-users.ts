import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: "206.189.200.180",
    user: "root",
    password: "Blanco123$",
    database: "prepa_regia",
  });

  console.log("Connected to database");

  const password = "Captura123$";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Creating 50 users...");

  for (let i = 1; i <= 50; i++) {
    const paddedNum = String(i).padStart(2, "0");
    const name = `CAPTURA ${paddedNum}`;
    const username = `captura${paddedNum}`;

    try {
      await connection.execute(
        "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
        [username, hashedPassword, name, "usuario"]
      );
      console.log(`Created user: ${username}`);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
        console.log(`User ${username} already exists, skipping...`);
      } else {
        throw error;
      }
    }
  }

  console.log("Done! Created 50 users");
  await connection.end();
}

seedUsers().catch(console.error);
