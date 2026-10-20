import { Award, icons } from "lucide-react";

// Match component names (TreePine) as well as kebab-case names (tree-pine).
const iconByName = new Map(
  Object.entries(icons).map(([name, component]) => [
    name.replace(/[^a-z0-9]/gi, "").toLowerCase(),
    component,
  ]),
);

export function MedailIcon({ name }: { name?: string | null }) {
  const Icon = iconByName.get((name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase()) ?? Award;
  return <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} aria-hidden="true" />;
}
