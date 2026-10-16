import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, HelpCircle, ArrowRight, Loader2, Globe, Leaf, Recycle, Footprints, Package, ImageIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { isNative } from "@/lib/platform";
import { takePhoto, pickFromGallery } from "@/lib/camera";
import { apiUploadImage, ScanResponse, getMockModeBadge } from "@/lib/api";

type ScanStep = "permission" | "camera" | "processing" | "result";

const CAMERA_PERMISSION_KEY = "ecogiro_camera_permission_granted";

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if returning from schedule page with preserved state
  const returnState = location.state as { 
    returnToResult?: boolean; 
    capturedImage?: string; 
    scanResult?: { material: string; peso: string; puntos_otorgados: string } 
  } | null;
  
  const [step, setStep] = useState<ScanStep>(() => {
    // If camera permission was previously granted, skip permission step
    if (returnState?.returnToResult) return "result";
    const hasPermission = localStorage.getItem(CAMERA_PERMISSION_KEY) === "true";
    return hasPermission ? "camera" : "permission";
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(returnState?.capturedImage || null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(() => {
    if (returnState?.returnToResult && returnState.scanResult) {
      // Reconstruct scanResult from preserved state
      return {
        materiales: [returnState.scanResult.material],
        preparacion: [],
        impacto_inmediato: [],
        daño_ambiental: [],
        peso_estimado: [`Total: ${parseFloat(returnState.scanResult.peso) * 1000} g`],
        puntaje: parseInt(returnState.scanResult.puntos_otorgados) || 0,
      };
    }
    return null;
  });
  const [useNativeCamera, setUseNativeCamera] = useState(false);
  
  // Web camera refs (fallback for web)
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if we should use native camera
  useEffect(() => {
    setUseNativeCamera(isNative());
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startWebCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("No se pudo acceder a la cámara. Verifica los permisos.");
      navigate(-1);
    }
  }, [navigate]);

  useEffect(() => {
    // Only start web camera if not using native and in camera step
    if (step === "camera" && !useNativeCamera) {
      startWebCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [step, useNativeCamera, startWebCamera, stopCamera]);

  const handlePermission = async () => {
    if (useNativeCamera) {
      // For native, go directly to camera step - permissions handled by Capacitor
      localStorage.setItem(CAMERA_PERMISSION_KEY, "true");
      setStep("camera");
    } else {
      // For web, check permissions first
      try {
        const permission = await navigator.mediaDevices.getUserMedia({ video: true });
        permission.getTracks().forEach(track => track.stop());
        localStorage.setItem(CAMERA_PERMISSION_KEY, "true");
        setStep("camera");
      } catch (error) {
        console.error("Camera permission denied:", error);
        toast.error("Permiso de cámara denegado. Actívalo en la configuración del navegador.");
      }
    }
  };

  const uploadImage = async (imageDataUrl: string): Promise<ScanResponse> => {
    const result = await apiUploadImage(imageDataUrl, user?.user_id || 1);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || "Error al procesar la imagen");
    }
    
    return result.data;
  };

  const processImage = async (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    stopCamera();
    setStep("processing");

    try {
      const result = await uploadImage(imageDataUrl);
      setScanResult(result);
      setStep("result");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("El scanner falló. Por favor, intenta de nuevo.");
      setStep("camera");
      if (!useNativeCamera) {
        startWebCamera();
      }
    }
  };

  // Native camera capture using Capacitor
  const handleNativeCapture = async () => {
    const photo = await takePhoto();
    if (photo) {
      await processImage(photo.dataUrl);
    } else {
      toast.error("No se pudo capturar la imagen. Intenta de nuevo.");
    }
  };

  // Native gallery pick using Capacitor
  const handleGalleryPick = async () => {
    const photo = await pickFromGallery();
    if (photo) {
      await processImage(photo.dataUrl);
    } else {
      toast.error("No se pudo seleccionar la imagen.");
    }
  };

  // Web camera capture
  const handleWebCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        await processImage(imageData);
      }
    }
  };

  const handleCapture = async () => {
    if (useNativeCamera) {
      await handleNativeCapture();
    } else {
      await handleWebCapture();
    }
  };

  const handleClose = () => {
    stopCamera();
    navigate(-1);
  };

  const handleSchedule = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    const pesoText = scanResult?.peso_estimado?.find(p => p.toLowerCase().includes("total")) || "";
    const pesoMatch = pesoText.match(/(\d+)\s*a\s*(\d+)/);
    const avgPeso = pesoMatch ? ((parseInt(pesoMatch[1]) + parseInt(pesoMatch[2])) / 2 / 1000).toFixed(3) : "0";
    
    const materialesText = scanResult?.materiales?.join(", ") || "Material reciclable";
    
    navigate("/schedule", {
      state: { 
        material: materialesText,
        peso: avgPeso,
        puntos_otorgados: scanResult?.puntaje?.toString() || "0",
        capturedImage: capturedImage,
      },
    });
  };

  const hasValidMaterials = scanResult?.materiales && 
    scanResult.materiales.length > 0 && 
    !scanResult.materiales.some(m => 
      m.toLowerCase().includes("no hay materiales") || 
      m.toLowerCase().includes("no se detectó") ||
      m.toLowerCase().includes("no visible")
    ) &&
    (scanResult?.puntaje ?? 0) > 0;

  const sectionConfig = [
    { key: "materiales", title: "Materiales detectados", icon: Package, iconColor: "text-primary" },
    { key: "preparacion", title: "Cómo prepararlo", icon: Footprints, iconColor: "text-primary" },
    { key: "impacto_inmediato", title: "Tu impacto positivo", icon: Leaf, iconColor: "text-primary" },
    { key: "daño_ambiental", title: "¿Qué pasaría si no reciclas?", icon: Globe, iconColor: "text-primary" },
    { key: "peso_estimado", title: "Peso estimado", icon: Package, iconColor: "text-primary" },
  ];

  // Permission step
  if (step === "permission") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-eco-green-light flex items-center justify-center mb-6 animate-scale-in">
          <Camera className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3 animate-fade-up">
          Escanea tu plástico
        </h1>
        <p className="text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: "50ms" }}>
          {useNativeCamera 
            ? "Usa tu cámara para analizar tu plástico en segundos."
            : "Necesitamos tu cámara para analizar tu plástico en segundos."
          }
        </p>
        <button
          onClick={handlePermission}
          className="eco-button-primary w-full max-w-xs animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {useNativeCamera ? "Abrir cámara" : "Permitir cámara"}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  // Camera step - different UI for native vs web
  if (step === "camera") {
    // Native camera: show button-based interface
    if (useNativeCamera) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-10">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-display font-semibold text-foreground">Escanear plástico</h1>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="w-32 h-32 rounded-3xl bg-eco-green-light flex items-center justify-center animate-scale-in">
              <Camera className="w-16 h-16 text-primary" />
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                ¿Cómo quieres escanear?
              </h2>
              <p className="text-muted-foreground text-sm">
                Toma una foto o selecciona una imagen de tu galería
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={handleNativeCapture}
                className="eco-button-primary w-full flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                Tomar foto
              </button>
              
              <button
                onClick={handleGalleryPick}
                className="eco-button-secondary w-full flex items-center justify-center gap-3"
              >
                <ImageIcon className="w-5 h-5" />
                Elegir de galería
              </button>
            </div>

            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      );
    }

    // Web camera: show video stream interface
    return (
      <div className="min-h-screen bg-foreground relative flex flex-col">
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="text-center mb-8">
              <p className="text-primary-foreground/90 text-lg font-medium drop-shadow-lg">
                Enfoca el plástico que quieres reciclar
              </p>
            </div>

            <div className="w-64 h-64 border-2 border-primary-foreground/50 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
            </div>

            <p className="mt-4 text-muted-foreground/80 drop-shadow-lg" style={{ fontSize: "10px" }}>
              Asegurate que solo se vean los residuos que quieras escannear para mejores resultados
            </p>

            <button className="mt-4 p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <HelpCircle className="w-6 h-6 drop-shadow-lg" />
            </button>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-6 left-6 p-2 bg-foreground/40 backdrop-blur-sm rounded-full hover:bg-foreground/60 transition-colors"
          >
            <X className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>

        <div className="bg-foreground/90 backdrop-blur-sm py-8 flex flex-col items-center gap-4 safe-area-pb">
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-elevated"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary" />
          </button>
          <button
            onClick={handleClose}
            className="text-primary-foreground/70 text-sm hover:text-primary-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Processing step
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "100dvh" }}>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-24 h-24 rounded-3xl bg-eco-green-light flex items-center justify-center mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">
            Analizando tu plástico
          </h1>
          <p className="text-muted-foreground">
            Estamos procesando la imagen...
          </p>
          {capturedImage && (
            <div className="mt-6 w-32 h-32 rounded-2xl overflow-hidden border-2 border-primary/20">
              <img 
                src={capturedImage} 
                alt="Procesando" 
                className="w-full h-full object-cover opacity-70"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result step
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-10">
        <button
          onClick={() => navigate("/")}
          className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Resultado del escaneo</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {capturedImage && (
          <div className="animate-scale-in">
            <div className="eco-card p-2 overflow-hidden">
              <img 
                src={capturedImage} 
                alt="Foto capturada" 
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
                  {!hasValidMaterials && (
                    <p className="text-center text-destructive mt-3" style={{ fontSize: "12px" }}>
                      Imagen invalida, vuelve a intentarlo enfocando bien los materiales
                    </p>
                  )}
          </div>
        )}

        {scanResult && (
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {sectionConfig.map(({ key, title, icon: Icon, iconColor }) => {
              const items = scanResult[key as keyof Omit<ScanResponse, 'puntaje'>];
              if (!items || !Array.isArray(items) || items.length === 0) return null;

              const isPreparacion = key === "preparacion";
              const isPesoEstimado = key === "peso_estimado";

              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-eco-green-light flex items-center justify-center", iconColor)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{title}</span>
                    </div>
                  </div>
                  
                  {isPesoEstimado ? (
                    (() => {
                      const totalLine = items.find(p => p.toLowerCase().includes("total")) || items[0] || "";
                      const pesoMatch = totalLine.match(/(\d+)\s*a\s*(\d+)/);
                      let avgKg = pesoMatch 
                        ? ((parseInt(pesoMatch[1]) + parseInt(pesoMatch[2])) / 2 / 1000).toFixed(4)
                        : "0";
                      
                      if (avgKg === "0" || avgKg === "0.0000") {
                        avgKg = "0,001";
                      }
                      
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="text-2xl font-bold text-primary">{avgKg} kg</span>
                          <span className="text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-full w-fit" style={{ fontSize: "8px" }}>Aproximado</span>
                        </div>
                      );
                    })()
                  ) : isPreparacion ? (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-sm font-semibold text-primary flex-shrink-0 w-5">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {items.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="pt-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {hasValidMaterials ? (
            <button
              onClick={handleSchedule}
              className="eco-button-primary w-full flex items-center justify-center gap-2"
            >
              Agendar recolección
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setCapturedImage(null);
                setScanResult(null);
                setStep("camera");
              }}
              className="eco-button-primary w-full flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Reintentar escaneo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
