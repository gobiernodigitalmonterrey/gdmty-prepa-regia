"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Registro {
  id: number;
  nombre_completo: string;
  telefono: string | null;
  sede: string | null;
  tipo: "graduado" | "invitado";
  asistio: boolean;
  fecha_nacimiento?: string | null;
}

interface EditModalProps {
  registro: Registro;
  sedes: string[];
  onSuccess?: () => void;
}

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export function EditModal({ registro, sedes, onSuccess }: EditModalProps) {
  const [open, setOpen] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(registro.nombre_completo);
  const [telefono, setTelefono] = useState(registro.telefono || "");
  const [sede, setSede] = useState(registro.sede || "");
  const [tipo, setTipo] = useState<"graduado" | "invitado">(registro.tipo);
  const [asistio, setAsistio] = useState(registro.asistio);
  const [fechaNacimiento, setFechaNacimiento] = useState(formatDateForInput(registro.fecha_nacimiento));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNombreCompleto(registro.nombre_completo);
      setTelefono(registro.telefono || "");
      setSede(registro.sede || "");
      setTipo(registro.tipo);
      setAsistio(registro.asistio);
      setFechaNacimiento(formatDateForInput(registro.fecha_nacimiento));
      setError("");
    }
  }, [open, registro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate sede for graduados
    if (tipo === "graduado" && !sede) {
      setError("La sede es requerida para graduados");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/registros", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: registro.id,
          nombre_completo: nombreCompleto,
          telefono,
          sede: tipo === "graduado" ? sede : null,
          tipo,
          fecha_nacimiento: fechaNacimiento,
          asistio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al actualizar registro");
      } else {
        setOpen(false);
        onSuccess?.();
      }
    } catch {
      setError("Ocurrió un error al actualizar el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
          <DialogDescription>
            Modificar información del registro
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(value: "graduado" | "invitado") => {
              setTipo(value);
              if (value === "invitado") setSede("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graduado">Graduado</SelectItem>
                <SelectItem value="invitado">Invitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
            <Input
              id="nombreCompleto"
              type="text"
              placeholder="Nombre completo"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="10 dígitos"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              maxLength={10}
              required
            />
          </div>
          {tipo === "graduado" && (
            <div className="space-y-2">
              <Label htmlFor="sede">Sede *</Label>
              <Select value={sede} onValueChange={setSede} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asistio">Asistió</Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${!asistio ? "text-red-600" : "text-gray-400"}`}>No</span>
              <Switch
                id="asistio"
                checked={asistio}
                onCheckedChange={setAsistio}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
              <span className={`text-sm font-medium ${asistio ? "text-green-600" : "text-gray-400"}`}>Sí</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
