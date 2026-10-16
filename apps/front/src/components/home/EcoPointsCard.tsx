import { Leaf, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface EcoPointsCardProps {
  points: number;
}

export function EcoPointsCard({ points }: EcoPointsCardProps) {
  return (
    <Link to="/rewards" className="eco-card flex items-center gap-4 group hover:shadow-elevated transition-shadow duration-200">
      <div className="w-12 h-12 rounded-2xl bg-eco-green-light flex items-center justify-center">
        <Leaf className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Eco-puntos</p>
        <p className="text-2xl font-display font-bold text-foreground">{points}</p>
      </div>
      <div className="flex items-center gap-1 text-sm text-primary font-medium">
        Ver recompensas
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
