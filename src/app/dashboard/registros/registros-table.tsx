"use client";

import { useEffect, useState, memo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistroModal } from "./registro-modal";
import { EditModal } from "./edit-modal";
import { DeleteButton } from "./delete-button";

interface Registro {
  id: number;
  nombre_completo: string;
  telefono: string | null;
  sede: string | null;
  invitados: number;
  fecha: string | null;
  tipo: "graduado" | "invitado";
  asistio: boolean;
  fecha_nacimiento: string | null;
}

// Memoized row component - only re-renders when its specific registro changes
const MemoizedRegistroRow = memo(function RegistroRow({
  registro,
  sedes,
  isAdmin,
  onRefresh,
}: {
  registro: Registro;
  sedes: string[];
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {registro.nombre_completo}
      </TableCell>
      <TableCell className="hidden md:table-cell">{registro.telefono || "-"}</TableCell>
      <TableCell className="hidden sm:table-cell">{registro.sede || "-"}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          registro.asistio
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {registro.asistio ? "Sí" : "No"}
        </span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          registro.tipo === "graduado"
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}>
          {registro.tipo === "graduado" ? "Graduado" : "Invitado"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <EditModal
            registro={registro}
            sedes={sedes}
            onSuccess={onRefresh}
          />
          {isAdmin && (
            <DeleteButton
              id={registro.id}
              nombre={registro.nombre_completo}
              onSuccess={onRefresh}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if the registro data actually changed
  return (
    prevProps.registro.id === nextProps.registro.id &&
    prevProps.registro.nombre_completo === nextProps.registro.nombre_completo &&
    prevProps.registro.telefono === nextProps.registro.telefono &&
    prevProps.registro.sede === nextProps.registro.sede &&
    prevProps.registro.asistio === nextProps.registro.asistio &&
    prevProps.registro.tipo === nextProps.registro.tipo &&
    prevProps.registro.fecha_nacimiento === nextProps.registro.fecha_nacimiento &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.sedes === nextProps.sedes
  );
});

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RegistrosTableProps {
  isAdmin: boolean;
}

export function RegistrosTable({ isAdmin }: RegistrosTableProps) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchSedes() {
      try {
        const response = await fetch("/api/sedes");
        const data = await response.json();
        setSedes(data);
      } catch (error) {
        console.error("Error fetching sedes:", error);
      }
    }
    fetchSedes();
  }, []);

  const fetchRegistros = async (page: number, searchTerm: string, sort: string, direction: "asc" | "desc", showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        sort,
        direction,
      });
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch(`/api/registros?${params}`);
      const data = await response.json();

      // Only update if data actually changed (prevents visual flicker)
      const newDataStr = JSON.stringify(data.data);
      const oldDataStr = JSON.stringify(registros);
      if (newDataStr !== oldDataStr) {
        setRegistros(data.data);
      }

      if (JSON.stringify(data.pagination) !== JSON.stringify(pagination)) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching registros:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros(pagination.page, search, sortColumn, sortDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 15 seconds (silent, no loading indicator)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRegistros(pagination.page, search, sortColumn, sortDirection, false);
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, sortColumn, sortDirection]);

  const handleSearch = () => {
    setSearch(searchInput);
    fetchRegistros(1, searchInput, sortColumn, sortDirection);
  };

  const handlePageChange = (newPage: number) => {
    fetchRegistros(newPage, search, sortColumn, sortDirection);
  };

  const handleRegistroCreated = () => {
    fetchRegistros(1, search, sortColumn, sortDirection);
  };

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);
    fetchRegistros(1, search, column, newDirection);
  };

  // Memoized refresh callback for row components
  const handleRowRefresh = useCallback(() => {
    fetchRegistros(pagination.page, search, sortColumn, sortDirection);
  }, [pagination.page, search, sortColumn, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Lista de Registros</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => window.open("/api/registros/export?tipo=graduado", "_blank")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="sm:hidden">Graduados</span>
                  <span className="hidden sm:inline">Graduados CSV</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => window.open("/api/registros/export?tipo=invitado", "_blank")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="sm:hidden">Invitados</span>
                  <span className="hidden sm:inline">Invitados CSV</span>
                </Button>
              </>
            )}
            <RegistroModal onSuccess={handleRegistroCreated} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, teléfono o sede..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron registros.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("nombre_completo")}
                    >
                      Nombre
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none hidden md:table-cell"
                      onClick={() => handleSort("telefono")}
                    >
                      Teléfono
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none hidden sm:table-cell"
                      onClick={() => handleSort("sede")}
                    >
                      Sede
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("asistio")}
                    >
                      Asistió
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none hidden sm:table-cell"
                      onClick={() => handleSort("tipo")}
                    >
                      Tipo
                    </TableHead>
                    <TableHead>Editar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <MemoizedRegistroRow
                      key={registro.id}
                      registro={registro}
                      sedes={sedes}
                      isAdmin={isAdmin}
                      onRefresh={handleRowRefresh}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
              <div className="text-sm text-gray-500">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} registros
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <span className="sm:hidden text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
