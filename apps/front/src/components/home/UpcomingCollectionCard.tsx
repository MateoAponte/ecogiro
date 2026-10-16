import { Clock, MapPin, Package, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  date: string;
  timeSlot: string;
  material: string;
  quantity: string;
  address: string;
  status: "pending" | "accepted" | "collected";
}

interface UpcomingCollectionCardProps {
  collection: Collection;
}

const statusConfig = {
  pending: {
    label: "En espera",
    className: "bg-eco-yellow-light text-foreground",
  },
  accepted: {
    label: "Aceptada",
    className: "bg-eco-green-light text-primary",
  },
  collected: {
    label: "Recolectada",
    className: "bg-muted text-muted-foreground",
  },
};

export function UpcomingCollectionCard({ collection }: UpcomingCollectionCardProps) {
  const status = statusConfig[collection.status];

  return (
    <Link
      to={`/collections/${collection.id}`}
      className="eco-card block space-y-3 group hover:shadow-elevated transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Próxima recolección</h3>
        <span className={cn("eco-badge", status.className)}>{status.label}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{collection.date} · {collection.timeSlot}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          <span>{collection.material} · {collection.quantity}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{collection.address}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 text-sm text-primary font-medium pt-1">
        Ver detalles
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
