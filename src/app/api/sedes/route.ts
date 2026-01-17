import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

interface SedeRow extends RowDataPacket {
  sede: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute<SedeRow[]>(
      `SELECT DISTINCT sede FROM registros WHERE sede IS NOT NULL AND sede != '' ORDER BY sede`
    );

    const sedes = rows.map((row) => row.sede);

    return NextResponse.json(sedes);
  } catch (error) {
    console.error("Error fetching sedes:", error);
    return NextResponse.json(
      { error: "Failed to fetch sedes" },
      { status: 500 }
    );
  }
}
