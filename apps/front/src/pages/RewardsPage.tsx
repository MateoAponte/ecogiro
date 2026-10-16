import { MobileLayout } from "@/components/layout/MobileLayout";
import { Leaf, Gift, Award, Sparkles, Recycle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Reward {
  id: number;
  title: string;
  points: number;
  image: string;
  subtitle?: string;
}

const mockData = {
  rewards: [
    { id: 1, title: "5% dcto en Juan Valdez", points: 50, image: "☕" },
    { id: 2, title: "10% dcto en productos Éxito", points: 100, image: "🏷️" },
    { id: 3, title: "Kit eco-aseo", points: 200, image: "🪥", subtitle: "Jabón artesanal y cepillo de bambú." },
    { id: 4, title: "Boletas de cine", points: 500, image: "🎬", subtitle: "2 entradas para ti" },
  ] as Reward[],
  medals: [
    { id: 1, title: "Primera Huella", subtitle: "Tu primer reciclaje", icon: Leaf, unlocked: true },
    { id: 2, title: "Guardián Verde", subtitle: "5 recolecciones", icon: Award, unlocked: true },
    { id: 3, title: "Reciclador Experto", subtitle: "10 kg reciclados", icon: Recycle, unlocked: false },
    { id: 4, title: "Eco-Héroe", subtitle: "50 recolecciones", icon: Sparkles, unlocked: false },
  ],
};

const triggerConfetti = () => {
  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#DCFCE7'],
  });
  
  // Second burst with delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#22C55E', '#16A34A', '#4ADE80'],
    });
  }, 150);
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#22C55E', '#16A34A', '#4ADE80'],
    });
  }, 300);
};

export default function RewardsPage() {
  const { getTotalPoints, deductPoints } = useAuth();
  const userPoints = getTotalPoints();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRewardClick = (reward: Reward) => {
    const isAvailable = userPoints >= reward.points;
    if (isAvailable) {
      setSelectedReward(reward);
      setIsDialogOpen(true);
    }
  };

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      const success = deductPoints(selectedReward.points);
      if (success) {
        triggerConfetti();
        toast.success(`¡Listo! Tu boleta de "${selectedReward.title}" fue enviada a tu correo 📧`);
      } else {
        toast.error("No tienes suficientes puntos para esta recompensa");
      }
      setIsDialogOpen(false);
      setSelectedReward(null);
    }
  };

  const handleCancelRedeem = () => {
    setIsDialogOpen(false);
    setSelectedReward(null);
  };

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        {/* Points header */}
        <header className="text-center animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-eco-green-light flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground text-sm">Tus eco-puntos</p>
          <h1 className="text-5xl font-display font-bold text-foreground">{userPoints}</h1>
        </header>

        {/* Rewards */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h2 className="eco-section-title">Recompensas</h2>
          <div className="grid grid-cols-2 gap-3">
            {mockData.rewards.map((reward) => {
              const pointsNeeded = reward.points - userPoints;
              const progress = Math.min((userPoints / reward.points) * 100, 100);
              const isAvailable = userPoints >= reward.points;
              
              return (
                  <button
                    key={reward.id}
                    onClick={() => handleRewardClick(reward)}
                    disabled={!isAvailable}
                    className={cn(
                      "eco-card text-center relative overflow-hidden flex flex-col min-h-[160px] text-left transition-all",
                      isAvailable 
                        ? "cursor-pointer hover:shadow-elevated active:scale-[0.98]" 
                        : "opacity-60 cursor-not-allowed"
                    )}
                  >
                  <div className="text-4xl mb-2">{reward.image}</div>
                  <h3 className="font-medium text-foreground text-sm">{reward.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 min-h-[28px]">
                    {reward.subtitle || "\u00A0"}
                  </p>
                  <div className="mt-auto pt-2">
                    <p className="text-xs text-muted-foreground">{reward.points} puntos</p>
                    {!isAvailable && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-primary font-medium mt-1 block">
                          ¡Te faltan {pointsNeeded} puntos!
                        </span>
                      </div>
                    )}
                  </div>
                  {!isAvailable && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Medals */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="eco-section-title">Medallas</h2>
          <div className="grid grid-cols-2 gap-3">
            {mockData.medals.map((medal) => (
                <div
                  key={medal.id}
                  className={cn(
                    "eco-card flex items-center gap-3",
                    !medal.unlocked && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center",
                      medal.unlocked ? "bg-eco-green-light" : "bg-muted"
                    )}
                  >
                    {medal.unlocked ? (
                      <medal.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                    )}
                  </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm truncate">{medal.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {medal.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact */}
        <section className="eco-section animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h2 className="eco-section-title">Tu impacto real</h2>
          <div className="space-y-3">
            <ImpactCard
              emoji="🌳"
              value="3 árboles"
              label="Has salvado el equivalente a 3 árboles con tu reciclaje"
              highlight="¡Sigue así!"
            />
            <ImpactCard
              emoji="👕"
              value="15 camisetas"
              label="Con 300 botellas recicladas se pueden fabricar 15 camisetas"
              highlight="Increíble aporte"
            />
            <ImpactCard
              emoji="🚗"
              value="50 km"
              label="Evitaste emisiones equivalentes a un viaje de 50 km en auto"
              highlight="Aire más limpio"
            />
          </div>
        </section>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              <span className="text-4xl block mb-2">{selectedReward?.image}</span>
              ¿Canjear recompensa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Estás a punto de canjear <strong>{selectedReward?.points} puntos</strong> por "{selectedReward?.title}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction 
              onClick={handleConfirmRedeem}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Sí, canjear
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={handleCancelRedeem}
              className="w-full mt-0 border-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              No, cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}

interface ImpactCardProps {
  emoji: string;
  value: string;
  label: string;
  highlight: string;
}

function ImpactCard({ emoji, value, label, highlight }: ImpactCardProps) {
  return (
    <div className="eco-card flex items-start gap-4">
      <div className="w-12 h-12 min-w-[48px] rounded-xl bg-eco-green-light flex items-center justify-center text-2xl">
        {emoji}
      </div>
      <div className="flex-1">
        <p className="font-display font-bold text-foreground text-lg">{value}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{label}</p>
        <span className="inline-block mt-1 text-[10px] font-medium text-primary bg-eco-green-light px-2 py-0.5 rounded-full">
          {highlight}
        </span>
      </div>
    </div>
  );
}
