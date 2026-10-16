import { ArrowLeft, Clock, MapPin, Package, ChevronRight, Star, DollarSign, Calendar, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { useReports, Report } from "@/contexts/ReportsContext";
import { formatDateToSpanish, reverseGeocode } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Helper to read saved ratings from localStorage
const STORAGE_KEY = "collection_ratings";

const getSavedRatings = (): Record<string, { rating: number; tip: number | null }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Status config
const statusConfig: Record<string, { label: string; className: string }> = {
  RECOGIDO: {
    label: "Recogido",
    className: "bg-eco-green-light text-primary",
  },
};

export default function CollectionHistoryPage() {
  const navigate = useNavigate();
  const { reports, isLoading, refetchReports } = useReports();
  const [savedRatings, setSavedRatings] = useState<Record<string, { rating: number; tip: number | null }>>({});
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    refetchReports();
    setSavedRatings(getSavedRatings());
  }, []);

  // Filter and sort history
  const history = useMemo(() => {
    let filtered = reports.filter((r) => r.rre_estado === "RECOGIDO");
    
    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((r) => new Date(r.rre_fecha_reporte) >= dateRange.from!);
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => new Date(r.rre_fecha_reporte) <= endOfDay);
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.rre_fecha_reporte).getTime() - new Date(a.rre_fecha_reporte).getTime()
    );
  }, [reports, dateRange]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const hasFilters = dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
          aria-label="Volver"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Historial completo</h1>
      </header>

      <div className="px-5 py-6 space-y-4 pb-24">
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: es })} - {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span className="text-muted-foreground">Filtrar por fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
              <div className="p-3 border-t border-border flex gap-2">
                {hasFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted border-gray-300"
                  >
                    Limpiar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={() => {}}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Filtrar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {history.length} recolección{history.length !== 1 ? "es" : ""} encontrada{history.length !== 1 ? "s" : ""}
        </p>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            <CollectionCardSkeleton />
            <CollectionCardSkeleton />
            <CollectionCardSkeleton />
          </div>
        )}

        {/* History List */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((report) => (
              <CollectionCard
                key={report.rre_id}
                report={report}
                savedData={savedRatings[report.rre_id.toString()]}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && history.length === 0 && (
          <div className="eco-card text-center py-8">
            <p className="text-muted-foreground">
              {hasFilters 
                ? "No hay recolecciones en el rango de fechas seleccionado" 
                : "Aún no tienes recolecciones completadas"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="eco-card space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

interface CollectionCardProps {
  report: Report;
  savedData?: { rating: number; tip: number | null };
}

function CollectionCard({ report, savedData }: CollectionCardProps) {
  const [address, setAddress] = useState<string>(report.rre_direccion_texto || "Cargando...");

  const status = statusConfig.RECOGIDO;
  const formattedDate = formatDateToSpanish(report.rre_fecha_reporte);
  const hasRating = savedData?.rating && savedData.rating > 0;
  const hasTip = savedData?.tip !== null && savedData?.tip !== undefined;

  useEffect(() => {
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
      className="eco-card block group hover:shadow-elevated transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("eco-badge", status.className)}>{status.label}</span>
          {hasRating && (
            <span className="flex items-center gap-0.5 text-xs text-eco-yellow">
              <Star className="w-3.5 h-3.5 fill-eco-yellow" />
              {savedData?.rating}
            </span>
          )}
          {hasTip && (
            <span className="flex items-center gap-0.5 text-xs text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              {savedData?.tip?.toLocaleString('es-CO')}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
