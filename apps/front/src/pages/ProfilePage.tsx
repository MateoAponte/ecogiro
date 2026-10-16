import { MobileLayout } from "@/components/layout/MobileLayout";
import { User, Mail, Phone, MapPin, Bell, Calendar, MessageCircle, FileText, ChevronRight, LogOut, Loader2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiGetProfile, UserProfile, getMockModeBadge } from "@/lib/api";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

const PROFILE_STORAGE_KEY = "eco_user_profile";

interface StoredProfile {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  imageUrl?: string;
}

const getStoredProfile = (): StoredProfile | null => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveStoredProfile = (profile: StoredProfile) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Error saving profile:", e);
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState(false);
  const [weeklyReminder, setWeeklyReminder] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.user_id) return;
      
      // First check for stored profile
      const stored = getStoredProfile();
      if (stored) {
        setLocalProfile(stored);
      }
      
      const result = await apiGetProfile(user.user_id);
      if (result.success && result.data) {
        setProfile(result.data);
        // Initialize local profile if not exists
        if (!stored) {
          const initialProfile: StoredProfile = {
            nombres: result.data.nombres,
            apellidos: result.data.apellidos,
            email: result.data.email,
            telefono: result.data.telefono,
            direccion: "Calle 68 Sur #49-21, Kennedy, Bogotá",
          };
          setLocalProfile(initialProfile);
          saveStoredProfile(initialProfile);
        }
      } else {
        toast.error(result.error || "No se pudo cargar el perfil");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user?.user_id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Sesión cerrada");
  };

  const handleSaveProfile = (data: StoredProfile) => {
    setLocalProfile(data);
    saveStoredProfile(data);
  };

  const mockBadge = getMockModeBadge();

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const displayProfile = localProfile || {
    nombres: profile?.nombres || "Usuario",
    apellidos: profile?.apellidos || "",
    email: profile?.email || "",
    telefono: profile?.telefono || "",
    direccion: "Calle 68 Sur #49-21, Kennedy, Bogotá",
  };
  
  const fullName = `${displayProfile.nombres} ${displayProfile.apellidos}`.trim();

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        {/* Mock Mode Badge */}
        {mockBadge && (
          <div className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full text-center animate-pulse">
            {mockBadge}
          </div>
        )}
        
        {/* Header with Edit Button */}
        <header className="text-center animate-fade-up relative">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-eco-green-light flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {localProfile?.imageUrl ? (
                <img src={localProfile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              aria-label="Editar perfil"
            >
              <Pencil className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">{fullName}</h1>
          <p className="text-muted-foreground text-sm">Miembro desde 2024</p>
        </header>

        {/* User info */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h2 className="eco-section-title">Datos personales</h2>
          <div className="eco-card space-y-4">
            <InfoRow icon={Mail} label="Correo" value={displayProfile.email} />
            <InfoRow icon={Phone} label="Teléfono" value={displayProfile.telefono ? `+57 ${displayProfile.telefono}` : ""} />
            <InfoRow icon={MapPin} label="Dirección" value={displayProfile.direccion} />
          </div>
        </section>

        {/* Preferences */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="eco-section-title">Preferencias</h2>
          <div className="eco-card space-y-4">
            <ToggleRow
              icon={Bell}
              label="Notificaciones push"
              description="Recibe alertas sobre tus recolecciones"
              checked={notifications}
              onChange={setNotifications}
            />
            <ToggleRow
              icon={Calendar}
              label="Recordatorio semanal"
              description="Te recordamos reciclar cada semana"
              checked={weeklyReminder}
              onChange={setWeeklyReminder}
            />
          </div>
        </section>

        {/* Support */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h2 className="eco-section-title">Soporte</h2>
          <div className="eco-card space-y-1 p-0 overflow-hidden">
            <LinkRow icon={MessageCircle} label="Preguntas frecuentes" to="/faq" />
          </div>
        </section>

        {/* Legal */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h2 className="eco-section-title">Legal</h2>
          <div className="eco-card space-y-1 p-0 overflow-hidden">
            <LinkRow icon={FileText} label="Política de datos" to="/privacy" />
            
            <div className="px-4 py-3 flex items-center justify-between border-t border-border">
              <span className="text-sm text-muted-foreground">Versión</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "250ms" }}>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </section>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={displayProfile}
        onSave={handleSaveProfile}
      />
    </MobileLayout>
  );
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform duration-200",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

interface LinkRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}

function LinkRow({ icon: Icon, label, to }: LinkRowProps & { to?: string }) {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => to && navigate(to)}
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-t border-border first:border-t-0"
    >
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="flex-1 text-left text-foreground">{label}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}
