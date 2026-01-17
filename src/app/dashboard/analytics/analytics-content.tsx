"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface Analytics {
  total: number;
  byTipo: { tipo: string; count: number }[];
  byAsistio: { asistio: number; count: number }[];
  bySede: { sede: string; count: number; asistieron: number }[];
  asistenciaByTipo: { tipo: string; asistio: number; count: number }[];
}

export function AnalyticsContent() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!contentRef.current) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(contentRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Create an image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(dataUrl, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`analytics_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const fetchAnalytics = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">Error al cargar analytics</div>;
  }

  const graduados = analytics.byTipo.find((t) => t.tipo === "graduado")?.count || 0;
  const invitados = analytics.byTipo.find((t) => t.tipo === "invitado")?.count || 0;
  const asistieron = analytics.byAsistio.find((a) => a.asistio === 1)?.count || 0;
  const noAsistieron = analytics.byAsistio.find((a) => a.asistio === 0)?.count || 0;

  const graduadosAsistieron = analytics.asistenciaByTipo.find(
    (a) => a.tipo === "graduado" && a.asistio === 1
  )?.count || 0;
  const invitadosAsistieron = analytics.asistenciaByTipo.find(
    (a) => a.tipo === "invitado" && a.asistio === 1
  )?.count || 0;

  return (
    <div className="space-y-6">
      {/* Download Button */}
      <div className="flex justify-end">
        <Button onClick={downloadPDF} disabled={downloading}>
          {downloading ? "Generando PDF..." : "Descargar PDF"}
        </Button>
      </div>

      <div ref={contentRef} className="space-y-6 bg-white p-4">
      {/* Title for PDF */}
      <h1 className="text-3xl font-bold text-center">Analytics</h1>
      <p className="text-center text-gray-500 text-sm">
        {new Date().toLocaleString("es-MX", { timeZone: "America/Monterrey" })}
      </p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Asistencia Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{asistieron}</div>
            <div className="text-sm text-gray-500">
              {analytics.total > 0 ? Math.round((asistieron / analytics.total) * 100) : 0}% del total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Graduados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{graduados}</div>
            <div className="text-sm text-gray-500">
              {graduadosAsistieron} asistieron ({graduados > 0 ? Math.round((graduadosAsistieron / graduados) * 100) : 0}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Invitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{invitados}</div>
            <div className="text-sm text-gray-500">
              {invitadosAsistieron} asistieron ({invitados > 0 ? Math.round((invitadosAsistieron / invitados) * 100) : 0}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asistencia Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Asistieron</span>
                <span className="font-bold text-green-600">{asistieron}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${analytics.total > 0 ? (asistieron / analytics.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>No Asistieron</span>
                <span className="font-bold text-red-600">{noAsistieron}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-red-500 h-4 rounded-full"
                  style={{ width: `${analytics.total > 0 ? (noAsistieron / analytics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Graduados</span>
                <span className="font-bold text-blue-600">{graduados}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${analytics.total > 0 ? (graduados / analytics.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Invitados</span>
                <span className="font-bold text-green-600">{invitados}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${analytics.total > 0 ? (invitados / analytics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seating Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Secciones de Asientos</CardTitle>
          <p className="text-sm text-gray-500">Cada sección tiene capacidad de 150 personas</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const SECTION_CAPACITY = 150;
            const sections: { letter: string; filled: number; capacity: number }[] = [];
            let remaining = asistieron;
            const letters = "ABCDEFGHIJKLMNÑOPRSTUVWXYZ".split("");

            let i = 0;
            while (remaining > 0 || sections.length === 0) {
              const filled = Math.min(remaining, SECTION_CAPACITY);
              sections.push({
                letter: letters[i] || `${i + 1}`,
                filled,
                capacity: SECTION_CAPACITY,
              });
              remaining -= filled;
              i++;
              if (remaining <= 0) break;
            }

            return (
              <div className="flex flex-wrap gap-4">
                {sections.map((section) => (
                  <div
                    key={section.letter}
                    className="relative w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all"
                      style={{ height: `${(section.filled / section.capacity) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{section.letter}</span>
                      <span className="text-sm font-medium text-gray-600">
                        {section.filled}/{section.capacity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* By Sede */}
      <Card>
        <CardHeader>
          <CardTitle>Por Sede</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.bySede.length === 0 ? (
            <div className="text-gray-500">No hay datos de sedes</div>
          ) : (
            <div className="space-y-4">
              {analytics.bySede.map((sede) => (
                <div key={sede.sede} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base">{sede.sede}</span>
                    <span className="font-bold">{sede.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${sede.count > 0 ? (sede.asistieron / sede.count) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-green-600 whitespace-nowrap">
                      {sede.asistieron} ({sede.count > 0 ? Math.round((sede.asistieron / sede.count) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
