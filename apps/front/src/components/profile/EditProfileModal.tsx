import { useState } from "react";
import { User, Mail, Phone, MapPin, Camera, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileData {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  imageUrl?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProfileData;
  onSave: (data: ProfileData) => void;
}

export function EditProfileModal({ isOpen, onClose, initialData, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData.imageUrl || null);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      toast.error("Nombre y apellidos son obligatorios");
      return;
    }
    if (!formData.email.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }
    if (formData.telefono && !/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      toast.error("El teléfono debe tener 10 dígitos");
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onSave(formData);
    toast.success("Perfil actualizado correctamente");
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95%] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Editar perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-eco-green-light flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange("nombres", e.target.value)}
                  placeholder="Tu nombre"
                  className="eco-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange("apellidos", e.target.value)}
                  placeholder="Tus apellidos"
                  className="eco-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="tu@email.com"
                className="eco-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Teléfono
              </Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted rounded-xl text-sm text-muted-foreground">
                  +57
                </span>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="3001234567"
                  className="eco-input flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Dirección
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                placeholder="Tu dirección de recolección"
                className="eco-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
