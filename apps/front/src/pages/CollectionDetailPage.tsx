import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Package, MessageSquare, Star, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useReports, Report } from "@/contexts/ReportsContext";
import { formatDateToSpanish, reverseGeocode } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";


// Helper functions for localStorage persistence
const STORAGE_KEY = "collection_ratings";

const getSavedRatings = (): Record<string, { rating: number; tip: number | null }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveRating = (collectionId: string, data: { rating?: number; tip?: number | null }) => {
  const current = getSavedRatings();
  current[collectionId] = {
    rating: data.rating ?? current[collectionId]?.rating ?? 0,
    tip: data.tip !== undefined ? data.tip : current[collectionId]?.tip ?? null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

// Status config - Estados: ACEPTADO, EN_ESPERA, RECOGIDO
const statusConfig: Record<string, { label: string; description: string; className: string; color: string }> = {
  ACEPTADO: {
    label: "Aceptado",
    description: "Un reciclador recogerá tu plástico en la franja seleccionada.",
    className: "bg-blue-100 text-blue-700",
    color: "text-blue-700",
  },
  EN_ESPERA: {
    label: "En espera",
    description: "Un reciclador revisará tu solicitud pronto.",
    className: "bg-eco-yellow-light text-foreground",
    color: "text-eco-yellow",
  },
  RECOGIDO: {
    label: "Recogido",
    description: "¡Gracias por reciclar! Tu impacto hace la diferencia.",
    className: "bg-eco-green-light text-primary",
    color: "text-primary",
  },
};

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { reports, isLoading: isLoadingReports, deleteReport, refetchReports } = useReports();

  const [report, setReport] = useState<Report | null>(null);
  const [address, setAddress] = useState<string>("Cargando dirección...");
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | string | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [hasTipped, setHasTipped] = useState(false);
  const [savedTipAmount, setSavedTipAmount] = useState<number | null>(null);

  // Find report from context
  useEffect(() => {
    if (!id || isLoadingReports) return;

    const foundReport = reports.find((r) => r.rre_id.toString() === id);
    if (foundReport) {
      setReport(foundReport);
    }
  }, [id, reports, isLoadingReports]);

  // Load address
  useEffect(() => {
    if (!report) return;

    if (report.rre_direccion_texto && report.rre_direccion_texto !== "string") {
      setAddress(report.rre_direccion_texto);
    } else if (report.rre_ubicacion_lat && report.rre_ubicacion_lng) {
      reverseGeocode(report.rre_ubicacion_lat, report.rre_ubicacion_lng)
        .then(setAddress)
        .catch(() => setAddress("Ubicación no disponible"));
    }
  }, [report]);

  // Load saved rating data
  useEffect(() => {
    if (!report) return;

    const savedData = getSavedRatings()[report.rre_id.toString()];
    if (savedData) {
      if (savedData.rating) {
        setRating(savedData.rating);
        setHasRated(true);
      }
      if (savedData.tip !== null && savedData.tip !== undefined) {
        setSelectedTip(savedData.tip);
        setSavedTipAmount(savedData.tip);
        setHasTipped(true);
      }
    }
  }, [report]);

  // Loading state
  if (isLoadingReports || !report) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-50">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
            aria-label="Volver"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">Detalle de recolección</h1>
        </header>
        <div className="px-5 py-6 space-y-6">
          <div className="text-center">
            <Skeleton className="h-8 w-24 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-3" />
          </div>
          <div className="eco-card space-y-4">
            <Skeleton className="h-5 w-20" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusKey = report.rre_estado?.toUpperCase() || "EN_ESPERA";
  const status = statusConfig[statusKey] || statusConfig.EN_ESPERA;
  const formattedDate = formatDateToSpanish(report.rre_fecha_reporte);
  const isCollected = statusKey === "RECOGIDO";

  const handleDeleteReport = async () => {
    if (!report) return;
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    deleteReport(report.rre_id);
    toast.success("Reporte eliminado");
    navigate("/collections");
  };

  const handleSaveComment = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    toast.success("Comentario guardado");
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    saveRating(report.rre_id.toString(), { rating });
    setIsSaving(false);
    setHasRated(true);
    toast.success("¡Gracias por tu calificación!");
  };

  const handleSendTip = async () => {
    const tipAmount = selectedTip === "custom" ? parseInt(customTip) : (selectedTip as number);
    if (!tipAmount || tipAmount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    saveRating(report.rre_id.toString(), { tip: tipAmount });
    setIsSaving(false);
    setHasTipped(true);
    setSavedTipAmount(tipAmount);
    toast.success("¡Propina enviada al reciclador!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors z-[60]"
          aria-label="Volver"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground pointer-events-none" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Detalle de recolección</h1>
      </header>

      <div className="px-5 py-6 space-y-6 pb-24">
        {/* Status */}
        <section className="text-center animate-fade-up">
          <span className={cn("eco-badge text-base px-4 py-2", status.className)}>{status.label}</span>
          <p className="text-muted-foreground text-sm mt-3 max-w-xs mx-auto">{status.description}</p>
        </section>

        {/* Details */}
        <section className="eco-card space-y-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h2 className="font-display font-semibold text-foreground">Resumen</h2>

          <div className="space-y-3">
            <DetailRow icon={Clock} label="Fecha y hora">
              {formattedDate}
            </DetailRow>
            <DetailRow icon={Package} label="Descripción">
              {report.rre_foto_descripcion || "Material reciclable"}
            </DetailRow>
            <DetailRow icon={MapPin} label="Dirección">
              {address}
            </DetailRow>
          </div>
        </section>

        {/* Comment Section - Only for pending/assigned */}
        {!isCollected && (
          <section className="eco-card space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-foreground">Comentario para el reciclador</h2>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Tocar el timbre del apto 301, dejar en portería..."
              className="eco-input min-h-[80px] resize-none"
            />
            <button 
              onClick={handleSaveComment} 
              disabled={isSaving} 
              className="w-full py-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50"
              style={{ fontSize: "14px" }}
            >
              {isSaving ? "Guardando..." : "Guardar comentario"}
            </button>
            <button
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="w-full py-3 text-destructive font-medium hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50"
              style={{ fontSize: "14px" }}
            >
              {isDeleting ? "Eliminando..." : "Eliminar recolección"}
            </button>
          </section>
        )}

        {/* Rating & Tip Section - Only for collected */}
        {isCollected && (
          <>
            {/* Star Rating */}
            <section className="eco-card space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-display font-semibold text-foreground">Califica al reciclador</h2>
              </div>

            {hasRated ? (
                <div className="text-center py-4">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-7 h-7 flex-shrink-0",
                          star <= rating ? "fill-eco-yellow text-eco-yellow" : "text-muted-foreground"
                        )}
                        style={{ width: 28, height: 28 }}
                      />
                    ))}
                  </div>
                  <p className="text-primary" style={{ fontSize: "12px" }}>Calificación enviada</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1.5 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            star <= rating
                              ? "fill-eco-yellow text-eco-yellow"
                              : "text-muted-foreground hover:text-eco-yellow/50"
                          )}
                          style={{ width: 36, height: 36 }}
                        />
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleSubmitRating}
                    disabled={isSaving || rating === 0}
                    className="w-full eco-button-primary"
                  >
                    {isSaving ? "Guardando..." : "Guardar calificación"}
                  </Button>
                </>
              )}
            </section>

            {/* Tip Section */}
            <section className="eco-card space-y-4 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-display font-semibold text-foreground">Donación para el reciclador</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Tu donación ayuda a reconocer el trabajo de nuestros recicladores
              </p>

              {hasTipped ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-eco-green-light rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-foreground font-semibold mb-1">
                    ${savedTipAmount?.toLocaleString("es-CO")}
                  </p>
                  <p className="text-primary" style={{ fontSize: "12px" }}>Donación enviada</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {[2000, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedTip(amount)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors text-left",
                          selectedTip === amount 
                            ? "border-primary bg-primary/5" 
                            : "border-border bg-card hover:border-muted-foreground/50"
                        )}
                      >
                        <span className="text-foreground font-medium">
                          ${amount.toLocaleString("es-CO")}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedTip("custom")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors text-left",
                        selectedTip === "custom" 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-card hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="text-foreground font-medium">Otro monto</span>
                    </button>
                  </div>

                  {selectedTip === "custom" && (
                    <div className="relative mt-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        placeholder="Ingresa el monto"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-border bg-card text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSendTip}
                    disabled={isSaving || !selectedTip || (selectedTip === "custom" && !customTip)}
                    className="w-full eco-button-primary mt-3"
                  >
                    {isSaving ? "Guardando..." : "Dar donación"}
                  </Button>
                </>
              )}

            </section>

            {/* Delete button outside the card */}
            <button
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="w-full py-3 text-destructive font-medium hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50"
              style={{ fontSize: "14px" }}
            >
              {isDeleting ? "Eliminando..." : "Eliminar recolección"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

function DetailRow({ icon: Icon, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}
