import { Camera } from "lucide-react";
import { Link } from "react-router-dom";

export function ScanButton() {
  return (
    <Link
      to="/scan"
      className="eco-button-primary w-full flex items-center justify-center gap-3 text-lg"
    >
      <Camera className="w-6 h-6" />
      <span>Escanear plástico</span>
    </Link>
  );
}
