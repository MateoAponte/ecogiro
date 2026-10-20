import { useState } from 'react';
import { Gift } from 'lucide-react';

export function RewardImage({ src, name }: { src?: string | null; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && failedSrc !== src ? (
    <img
      src={src}
      alt={name}
      className="h-20 w-full object-contain mb-2 rounded-lg"
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <Gift className="w-10 h-10 text-primary mx-auto mb-2" aria-label={name} />
  );
}
