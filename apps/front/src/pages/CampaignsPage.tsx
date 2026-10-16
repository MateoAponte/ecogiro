import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Plus, Calendar, DollarSign, Target, LogOut, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  objective: string;
  description: string;
  approximatePrice: string;
  endDate: string;
  createdAt: string;
  status: "active" | "accepted";
}

const CAMPAIGNS_STORAGE_KEY = "acopio_campaigns";
const CITIZEN_NOTIFICATIONS_KEY = "citizen_notifications";

const getCampaigns = (): Campaign[] => {
  try {
    const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCampaigns = (campaigns: Campaign[]) => {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
};

// Function to add notification for citizen users
const addCitizenNotification = (campaign: Campaign) => {
  try {
    const stored = localStorage.getItem(CITIZEN_NOTIFICATIONS_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const newNotification = {
      id: `notif-${Date.now()}`,
      title: "¡Nueva campaña de reciclaje!",
      message: `Si reciclas ${campaign.objective.toLowerCase()} esta semana, ¡recibirás puntos dobles para tus beneficios! Precio: $${campaign.approximatePrice}/kg`,
      type: "campaign",
      read: false,
      createdAt: new Date().toISOString(),
      campaignId: campaign.id,
    };
    
    localStorage.setItem(CITIZEN_NOTIFICATIONS_KEY, JSON.stringify([newNotification, ...notifications]));
  } catch (error) {
    console.error("Error adding citizen notification:", error);
  }
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [approximatePrice, setApproximatePrice] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setCampaigns(getCampaigns());
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Sesión cerrada");
  };

  const resetForm = () => {
    setObjective("");
    setDescription("");
    setApproximatePrice("");
    setEndDate("");
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!objective.trim() || !description.trim() || !approximatePrice.trim() || !endDate) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      objective: objective.trim(),
      description: description.trim(),
      approximatePrice: approximatePrice.trim(),
      endDate,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    const updatedCampaigns = [newCampaign, ...campaigns];
    setCampaigns(updatedCampaigns);
    saveCampaigns(updatedCampaigns);

    // Add notification for citizen users
    addCitizenNotification(newCampaign);

    setIsSubmitting(false);
    setIsModalOpen(false);
    resetForm();
    toast.success("¡Campaña creada exitosamente! Los ciudadanos han sido notificados.");
  };

  const handleAcceptCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map((c) =>
      c.id === campaignId ? { ...c, status: "accepted" as const } : c
    );
    setCampaigns(updatedCampaigns);
    saveCampaigns(updatedCampaigns);
    toast.success("¡Campaña marcada como aceptada!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-primary px-5 py-4 flex items-center justify-between z-50">
        <div>
          <h1 className="text-xl font-display font-bold text-primary-foreground">Centro de Acopio</h1>
          <p className="text-sm text-primary-foreground/80">Gestiona tus campañas</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-xl transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground">Salir</span>
        </button>
      </header>

      <div className="px-5 py-6 space-y-6 pb-8">
        <section className="animate-fade-up">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Campañas Activas
          </h2>

          {campaigns.length === 0 ? (
            /* Empty State */
            <div className="eco-card text-center py-12">
              <div className="w-16 h-16 bg-eco-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No tienes campañas activas
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Las campañas te permiten recolectar materiales específicos de los ciudadanos. 
                Crea tu primera campaña y comienza a recibir reciclables.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="eco-button-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear mi primera campaña
              </Button>
            </div>
          ) : (
            /* Campaigns List */
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="eco-card space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-eco-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{campaign.objective}</h3>
                        {campaign.status === "accepted" ? (
                          <Badge className="bg-primary/10 text-primary border-0 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aceptada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Activa
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {campaign.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>${campaign.approximatePrice}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Hasta {formatDate(campaign.endDate)}</span>
                      </div>
                    </div>
                    {campaign.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcceptCampaign(campaign.id)}
                        className="text-primary hover:bg-eco-green-light hover:text-primary text-xs"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marcar aceptada
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full eco-button-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear nueva campaña
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Crear nueva campaña</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                Objetivo de la campaña
              </label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ej: Recolección de botellas PET"
                className="eco-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Descripción
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Necesitamos 500kg de plástico PET para fabricar mobiliario urbano. Al aceptar esta campaña recibirás notificación por Telegram con los detalles de entrega."
                className="eco-input min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Precio aproximado por kg
              </label>
              <Input
                value={approximatePrice}
                onChange={(e) => setApproximatePrice(e.target.value)}
                placeholder="Ej: 500"
                className="eco-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Fecha máxima de finalización
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="eco-input"
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button
              type="submit"
              className="w-full eco-button-primary mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear campaña"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
