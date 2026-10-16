import { MobileLayout } from "@/components/layout/MobileLayout";
import { Clock, MapPin, Package, ChevronRight, Star, DollarSign, Calendar, X } from "lucide-react";
import { Link } from "react-router-dom";
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

export default function CollectionsPage() {
  const { reports, isLoading, refetchReports } = useReports();
  const [savedRatings, setSavedRatings] = useState<Record<string, { rating: number; tip: number | null }>>({});
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    refetchReports();
    setSavedRatings(getSavedRatings());
  }, []);

  // Filter and sort reports
  const { upcoming, history } = useMemo(() => {
    let upcomingReports = reports.filter((r) => r.rre_estado === "EN_ESPERA" || r.rre_estado === "ACEPTADO");
    let historyReports = reports.filter((r) => r.rre_estado === "RECOGIDO");
    
    // Apply date range filter to upcoming
    if (dateRange.from) {
      upcomingReports = upcomingReports.filter((r) => new Date(r.rre_fecha_reporte) >= dateRange.from!);
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      upcomingReports = upcomingReports.filter((r) => new Date(r.rre_fecha_reporte) <= endOfDay);
    }
    
    // Sort upcoming by date (nearest first - ascending)
    upcomingReports = upcomingReports.sort((a, b) => 
      new Date(a.rre_fecha_reporte).getTime() - new Date(b.rre_fecha_reporte).getTime()
    );
    
    // Sort history by date (newest first - descending) and limit to 3
    historyReports = historyReports
      .sort((a, b) => new Date(b.rre_fecha_reporte).getTime() - new Date(a.rre_fecha_reporte).getTime())
      .slice(0, 3);
    
    return { upcoming: upcomingReports, history: historyReports };
  }, [reports, dateRange]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setTempDateRange({ from: undefined, to: undefined });
  };

  const applyFilters = () => {
    setDateRange({ from: tempDateRange.from, to: tempDateRange.to });
    setIsCalendarOpen(false);
  };

  const handleCalendarOpen = (open: boolean) => {
    if (open) {
      setTempDateRange({ from: dateRange.from, to: dateRange.to });
    }
    setIsCalendarOpen(open);
  };

  const hasFilters = dateRange.from || dateRange.to;
  const totalHistory = reports.filter((r) => r.rre_estado === "RECOGIDO").length;

  // Format date range display
  const getDateRangeText = () => {
    if (!dateRange.from) return null;
    if (dateRange.to) {
      return `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM", { locale: es })}`;
    }
    return format(dateRange.from, "dd MMM", { locale: es });
  };

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        {/* Header */}
        <header className="animate-fade-up">
          <h1 className="text-2xl font-display font-bold text-foreground">Recolecciones</h1>
          <p className="text-muted-foreground mt-1">Revisa el estado de tus solicitudes</p>
        </header>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <section className="eco-section">
              <h2 className="eco-section-title">Próximas</h2>
              <div className="space-y-3">
                <CollectionCardSkeleton />
                <CollectionCardSkeleton />
              </div>
            </section>
          </div>
        )}

        {/* Upcoming */}
        {!isLoading && (
          <section className="eco-section animate-fade-up" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="eco-section-title mb-0">Próximas</h2>
              
              {/* Date Filter */}
              <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                      "bg-card border-[1.5px] border-gray-300",
                      "hover:border-gray-400",
                      "focus:outline-none focus:border-primary focus:border-2",
                      hasFilters && "border-primary border-2 bg-primary/5"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {hasFilters ? (
                      <span className="text-foreground">{getDateRangeText()}</span>
                    ) : (
                      <span className="text-muted-foreground">Filtrar</span>
                    )}
                    {hasFilters && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilters();
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-muted"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">Selecciona un rango</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tempDateRange.from ? (
                        tempDateRange.to ? (
                          <>
                            <span className="text-primary font-medium">
                              {format(tempDateRange.from, "dd MMM yyyy", { locale: es })}
                            </span>
                            {" → "}
                            <span className="text-primary font-medium">
                              {format(tempDateRange.to, "dd MMM yyyy", { locale: es })}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-primary font-medium">
                              {format(tempDateRange.from, "dd MMM yyyy", { locale: es })}
                            </span>
                            {" → "}
                            <span className="text-muted-foreground italic">Selecciona fecha final</span>
                          </>
                        )
                      ) : (
                        "Toca una fecha para comenzar"
                      )}
                    </p>
                  </div>
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={tempDateRange.from}
                    selected={tempDateRange}
                    onSelect={(range, selectedDay) => {
                      if (tempDateRange.from && tempDateRange.to && selectedDay) {
                        setTempDateRange({ from: selectedDay, to: undefined });
                      } else {
                        setTempDateRange({ from: range?.from, to: range?.to });
                      }
                    }}
                    numberOfMonths={1}
                    className="p-3 pointer-events-auto"
                  />
                  <div className="p-3 border-t border-border flex gap-2">
                    {(tempDateRange.from || tempDateRange.to) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setTempDateRange({ from: undefined, to: undefined })}
                        className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted border-gray-300"
                      >
                        Limpiar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={applyFilters}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Filtrar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((report) => (
                  <CollectionCard
                    key={report.rre_id}
                    report={report}
                    savedData={savedRatings[report.rre_id.toString()]}
                  />
                ))}
              </div>
            ) : (
              <div className="eco-card text-center py-6">
                <p className="text-muted-foreground">
                  {hasFilters 
                    ? "No hay recolecciones en el rango seleccionado" 
                    : "No tienes recolecciones próximas"
                  }
                </p>
              </div>
            )}
          </section>
        )}

        {/* History */}
        {!isLoading && (
          <section className="eco-section animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="eco-section-title mb-0">Historial</h2>
              {totalHistory > 3 && (
                <Link 
                  to="/collections/history" 
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  Ver más
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((report) => (
                  <CollectionCard
                    key={report.rre_id}
                    report={report}
                    savedData={savedRatings[report.rre_id.toString()]}
                  />
                ))}
              </div>
            ) : (
              <div className="eco-card text-center py-8">
                <p className="text-muted-foreground">Aún no tienes recolecciones completadas</p>
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {!isLoading && reports.length === 0 && (
          <div className="eco-card text-center py-8">
            <p className="text-muted-foreground">No tienes recolecciones registradas</p>
          </div>
        )}
      </div>
    </MobileLayout>
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

  const statusKey = report.rre_estado?.toUpperCase() || "EN_ESPERA";
  const status = statusConfig[statusKey] || statusConfig.EN_ESPERA;
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
