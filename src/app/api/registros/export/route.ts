import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

interface RegistroRow extends RowDataPacket {
  id: number;
  nombre_completo: string;
  telefono: string | null;
  sede: string | null;
  tipo: "graduado" | "invitado";
  asistio: boolean;
  fecha_nacimiento: Date | null;
  created_at: Date;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get("tipo");

    if (!tipo || (tipo !== "graduado" && tipo !== "invitado")) {
      return NextResponse.json(
        { error: "Tipo debe ser 'graduado' o 'invitado'" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<RegistroRow[]>(
      `SELECT id, nombre_completo, telefono, sede, tipo, asistio, fecha_nacimiento, created_at
       FROM registros
       WHERE tipo = ?
       ORDER BY nombre_completo ASC`,
      [tipo]
    );

    // Build CSV
    const headers = ["Nombre Completo", "Telefono", "Sede", "Asistio", "Fecha Nacimiento", "Fecha Registro"];
    const csvRows = [headers.join(",")];

    for (const row of rows) {
      const csvRow = [
        escapeCSV(row.nombre_completo),
        escapeCSV(row.telefono),
        escapeCSV(row.sede),
        row.asistio ? "SI" : "NO",
        formatDate(row.fecha_nacimiento),
        formatDate(row.created_at),
      ].join(",");
      csvRows.push(csvRow);
    }

    const csv = csvRows.join("\n");
    const filename = `${tipo}s_${new Date().toISOString().split("T")[0]}.csv`;

    // Add UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csv;

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting registros:", error);
    return NextResponse.json(
      { error: "Failed to export registros" },
      { status: 500 }
    );
  }
}
