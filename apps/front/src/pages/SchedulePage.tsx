import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MessageSquare, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import AddressInput from "@/components/schedule/AddressInput";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";

// Default address: El Regalo, Bosa, Bogotá
const DEFAULT_ADDRESS = "Calle 73 Sur #80C-21, El Regalo, Bosa, Bogotá";
const DEFAULT_COORDS: [number, number] = [-74.1901, 4.6201];

const timeSlots = [
  { id: "8-11", label: "8:00 - 11:00", hour: 8 },
  { id: "11-14", label: "11:00 - 14:00", hour: 11 },
  { id: "14-17", label: "14:00 - 17:00", hour: 14 },
  { id: "17-20", label: "17:00 - 20:00", hour: 17 },
];

// Material to type ID mapping
const materialToTypeId: Record<string, number> = {
  "PET": 1,
  "PLASTICO": 2,
  "PLÁSTICO": 2,
  "PP": 3,
  "CARTÓN": 4,
  "CARTON": 4,
  "VIDRIO": 5,
};

const getMaterialTypeId = (material: string): number => {
  const upperMaterial = material.toUpperCase();
  for (const [key, value] of Object.entries(materialToTypeId)) {
    if (upperMaterial.includes(key)) {
      return value;
    }
  }
  return 1; // Default to PET
};

export default function SchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, addPoints } = useAuth();
  const { addReport, refetchReports } = useReports();
  
  const { material, peso, puntos_otorgados, capturedImage } = location.state || {
    material: "PET",
    peso: "0",
    puntos_otorgados: "0",
    capturedImage: null,
  };

  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [addressCoords, setAddressCoords] = useState<[number, number]>(DEFAULT_COORDS);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Minimum date is tomorrow
  const minDate = addDays(new Date(), 1);

  // Handle address change with coordinates
  const handleAddressChange = (newAddress: string, coords?: [number, number]) => {
    setAddress(newAddress);
    if (coords) {
      setAddressCoords(coords);
    }
  };

  const canSubmit = address && selectedDate && selectedTime;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !selectedDate) return;
    setIsSubmitting(true);

    try {
      // Small delay to give loader feedback
      await new Promise(resolve => setTimeout(resolve, 1200));

      const selectedTimeSlot = timeSlots.find(t => t.id === selectedTime);
      const fechaRecoleccion = selectedTimeSlot 
        ? setMinutes(setHours(selectedDate, selectedTimeSlot.hour), 0)
        : selectedDate;

      // Ensure minimum weight of 0.02kg
      const cantidadKg = Math.max(parseFloat(peso) || 0.02, 0.02);
      const puntosOtorgados = parseInt(puntos_otorgados) || 0;

      // Create report in localStorage
      const reportData = {
        usu_ciudadano_id: user.user_id,
        usu_reciclador_id: 0,
        tma_id: getMaterialTypeId(material),
        rre_cantidad_kg: cantidadKg.toFixed(2),
        rre_foto_url: capturedImage ? `image_${Date.now()}.jpg` : "",
        rre_foto_descripcion: comment,
        rre_ubicacion_lat: addressCoords[1].toString(),
        rre_ubicacion_lng: addressCoords[0].toString(),
        rre_direccion_texto: address,
        rre_estado: "EN_ESPERA",
        rre_fecha_reporte: fechaRecoleccion.toISOString(),
        rre_puntos_otorgados: puntosOtorgados,
      };

      // Add report to localStorage
      addReport(reportData);

      // Points will be added when recycler accepts the request

      // Refresh reports list
      await refetchReports();

      toast({
        title: "¡Solicitud enviada! 🎉",
        description: "EcoGiro notificará a un reciclador. Te avisaremos cuando acepte.",
      });
      navigate("/collections");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al enviar la solicitud";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-10">
        <button 
          onClick={() => {
            // Navigate back to scan result with state preserved
            navigate("/scan", { 
              state: { 
                returnToResult: true,
                capturedImage,
                scanResult: {
                  material,
                  peso,
                  puntos_otorgados,
                }
              } 
            });
          }} 
          className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Agendar recolección</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Material summary */}
        <div className="eco-card bg-eco-green-light border border-primary/10 animate-fade-up">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-primary" style={{ fontSize: "14px" }}>{material}</span>
        {peso && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-medium" style={{ fontSize: "12px" }}>{Math.max(parseFloat(peso) || 0.02, 0.02).toFixed(2)}kg</span>
                <span className="text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded-full" style={{ fontSize: "8px" }}>Aproximado</span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h2 className="eco-section-title">Dirección de recolección *</h2>
          <AddressInput value={address} onChange={handleAddressChange} />
        </section>

        {/* Date */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="eco-section-title flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Fecha * <span className="text-xs text-muted-foreground font-normal">(mínimo 24 horas)</span>
          </h2>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "eco-input w-full text-left flex items-center justify-between",
                !selectedDate && "text-muted-foreground"
              )}>
                {selectedDate ? (
                  <span className="capitalize">
                    {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
                  </span>
                ) : (
                  "Selecciona una fecha"
                )}
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDatePopoverOpen(false);
                }}
                disabled={(date) => date < minDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </section>

        {/* Time slots */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h2 className="eco-section-title flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Franja horaria *
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedTime(slot.id)}
                className={cn(
                  "eco-chip py-3",
                  selectedTime === slot.id ? "eco-chip-active" : "eco-chip-inactive"
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>

        {/* Comment */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h2 className="eco-section-title flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comentario (opcional)
          </h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ej: Tocar el timbre del apto 301"
            rows={3}
            className="eco-input resize-none"
          />
        </section>

        {/* Submit */}
        <div className="pt-4 space-y-3 animate-fade-up" style={{ animationDelay: "250ms" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "eco-button-primary w-full flex items-center justify-center gap-2",
              (!canSubmit || isSubmitting) && "opacity-50 cursor-not-allowed shadow-none"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirmar solicitud
              </>
            )}
          </button>
          <p className="text-xs text-center text-muted-foreground">
            EcoGiro notificará a un reciclador. Te avisaremos cuando acepte.
          </p>
        </div>
      </div>
    </div>
  );
}
