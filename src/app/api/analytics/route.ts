import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  try {
    // Total counts
    const [totalRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM registros"
    );

    // By tipo
    const [tipoRows] = await pool.execute<RowDataPacket[]>(
      "SELECT tipo, COUNT(*) as count FROM registros GROUP BY tipo"
    );

    // By asistio
    const [asistioRows] = await pool.execute<RowDataPacket[]>(
      "SELECT asistio, COUNT(*) as count FROM registros GROUP BY asistio"
    );

    // By sede with asistencia (only graduados have sede)
    const [sedeRows] = await pool.execute<RowDataPacket[]>(
      `SELECT sede,
              COUNT(*) as count,
              SUM(CASE WHEN asistio = 1 THEN 1 ELSE 0 END) as asistieron
       FROM registros
       WHERE sede IS NOT NULL
       GROUP BY sede
       ORDER BY count DESC`
    );

    // Asistencia by tipo
    const [asistenciaTipoRows] = await pool.execute<RowDataPacket[]>(
      "SELECT tipo, asistio, COUNT(*) as count FROM registros GROUP BY tipo, asistio"
    );

    return NextResponse.json({
      total: totalRows[0].total,
      byTipo: tipoRows,
      byAsistio: asistioRows,
      bySede: sedeRows,
      asistenciaByTipo: asistenciaTipoRows,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
