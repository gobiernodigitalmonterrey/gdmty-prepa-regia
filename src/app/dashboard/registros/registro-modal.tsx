"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegistroModalProps {
  onSuccess?: () => void;
}

export function RegistroModal({ onSuccess }: RegistroModalProps) {
  const [open, setOpen] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sedes, setSedes] = useState<string[]>([]);

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
  const [sede, setSede] = useState("");
  const [tipo, setTipo] = useState<"graduado" | "invitado">("invitado");
  const nombreInputRef = useRef<HTMLInputElement>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setNombreCompleto("");
    setTelefono("");
    setSede("");
    setTipo("invitado");
    setFechaNacimiento("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/registros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo: nombreCompleto,
          telefono: telefono || null,
          sede: sede || null,
          tipo,
          fecha_nacimiento: fechaNacimiento || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear registro");
      } else {
        resetForm();
        setOpen(false);
        onSuccess?.();
      }
    } catch {
      setError("Ocurrió un error al crear el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
      if (isOpen) {
        setTimeout(() => nombreInputRef.current?.focus(), 100);
      }
    }}>
      <DialogTrigger asChild>
        <Button>Nuevo Registro</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Registro</DialogTitle>
          <DialogDescription>
            Registrar un nuevo graduado o invitado
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
              ref={nombreInputRef}
              id="nombreCompleto"
              type="text"
              placeholder="Nombre completo"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="10 dígitos"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              maxLength={10}
            />
          </div>
          {tipo === "graduado" && (
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Select value={sede} onValueChange={setSede}>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
