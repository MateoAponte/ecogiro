import { Clock, MapPin, Package, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Report } from "@/contexts/ReportsContext";
import { formatDateToSpanish, reverseGeocode } from "@/utils/formatters";
import { useEffect, useState } from "react";

interface UpcomingCollectionFromAPIProps {
  report: Report;
}

// Status config - Estados: ACEPTADO, EN_ESPERA, RECOGIDO
const statusConfig: Record<string, { label: string; className: string }> = {
  ACEPTADO: {
    label: "Aceptado",
    className: "bg-blue-100 text-blue-700",
  },
  EN_ESPERA: {
    label: "En espera",
    className: "bg-eco-yellow-light text-foreground",
  },
  RECOGIDO: {
    label: "Recogido",
    className: "bg-eco-green-light text-primary",
  },
};

export function UpcomingCollectionFromAPI({ report }: UpcomingCollectionFromAPIProps) {
  const [address, setAddress] = useState<string>(report.rre_direccion_texto || "Cargando dirección...");
  
  const statusKey = report.rre_estado?.toUpperCase() || "EN_ESPERA";
  const status = statusConfig[statusKey] || statusConfig.EN_ESPERA;
  const formattedDate = formatDateToSpanish(report.rre_fecha_reporte);

  useEffect(() => {
    // If we have a text address, use it; otherwise try to reverse geocode
    if (report.rre_direccion_texto && report.rre_direccion_texto !== "string") {
      setAddress(report.rre_direccion_texto);
    } else if (report.rre_ubicacion_lat && report.rre_ubicacion_lng) {
      reverseGeocode(report.rre_ubicacion_lat, report.rre_ubicacion_lng)
        .then(setAddress)
        .catch(() => setAddress("Ubicación no disponible"));
    }
  }, [report.rre_direccion_texto, report.rre_ubicacion_lat, report.rre_ubicacion_lng]);

  return (
    <Link
      to={`/collections/${report.rre_id}`}
      className="eco-card block space-y-3 group hover:shadow-elevated transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <span className={cn("eco-badge", status.className)}>{status.label}</span>
        <div className="flex items-center gap-1 text-sm text-primary font-medium">
          Ver detalles
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>{report.rre_foto_descripcion || "Material reciclable"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      </div>
    </Link>
  );
}
