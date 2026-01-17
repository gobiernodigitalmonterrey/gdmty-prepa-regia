import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface RegistroRow extends RowDataPacket {
  id: number;
  nombre_completo: string;
  telefono: string | null;
  sede: string | null;
  invitados: number;
  fecha: Date | null;
  tipo: "graduado" | "invitado";
  asistio: boolean;
  fecha_nacimiento: Date | null;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "id";
    const direction = searchParams.get("direction") === "asc" ? "ASC" : "DESC";

    // Whitelist allowed sort columns to prevent SQL injection
    const allowedSortColumns = ["id", "nombre_completo", "telefono", "sede", "asistio", "tipo"];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : "id";

    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: (string | number)[] = [];

    if (search) {
      whereClause = "WHERE nombre_completo LIKE ? OR telefono LIKE ? OR sede LIKE ?";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const [countResult] = await pool.execute<CountRow[]>(
      `SELECT COUNT(*) as total FROM registros ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.execute<RegistroRow[]>(
      `SELECT id, nombre_completo, telefono, sede, invitados, fecha, tipo, asistio, fecha_nacimiento, created_at
       FROM registros ${whereClause}
       ORDER BY ${sortColumn} ${direction}
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching registros:", error);
    return NextResponse.json(
      { error: "Failed to fetch registros" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nombre_completo, telefono, sede, tipo, fecha_nacimiento } = await request.json();

    if (!nombre_completo) {
      return NextResponse.json(
        { error: "Nombre completo es requerido" },
        { status: 400 }
      );
    }

    if (!fecha_nacimiento) {
      return NextResponse.json(
        { error: "Fecha de nacimiento es requerida" },
        { status: 400 }
      );
    }

    const validTipo = tipo === "graduado" ? "graduado" : "invitado";

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO registros (nombre_completo, telefono, sede, tipo, fecha_nacimiento, asistio)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [
        nombre_completo.toUpperCase(),
        telefono || null,
        sede ? sede.toUpperCase() : null,
        validTipo,
        fecha_nacimiento || null,
      ]
    );

    return NextResponse.json(
      { id: result.insertId, nombre_completo, tipo: validTipo },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating registro:", error);
    return NextResponse.json(
      { error: "Failed to create registro" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, nombre_completo, telefono, sede, tipo, fecha_nacimiento, asistio } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID es requerido" },
        { status: 400 }
      );
    }

    const validTipo = tipo === "graduado" ? "graduado" : "invitado";

    await pool.execute(
      `UPDATE registros SET
        nombre_completo = ?,
        telefono = ?,
        sede = ?,
        tipo = ?,
        fecha_nacimiento = ?,
        asistio = ?
       WHERE id = ?`,
      [
        nombre_completo ? nombre_completo.toUpperCase() : null,
        telefono || null,
        sede ? sede.toUpperCase() : null,
        validTipo,
        fecha_nacimiento || null,
        asistio ?? false,
        id,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating registro:", error);
    return NextResponse.json(
      { error: "Failed to update registro" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID es requerido" },
        { status: 400 }
      );
    }

    await pool.execute("DELETE FROM registros WHERE id = ?", [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting registro:", error);
    return NextResponse.json(
      { error: "Failed to delete registro" },
      { status: 500 }
    );
  }
}
