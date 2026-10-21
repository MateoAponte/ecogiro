import { useState } from 'react';
import { Gift } from 'lucide-react';

export function RewardImage({ src, name }: { src?: string | null; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className="mb-3 flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-eco-green-light/50 p-3 sm:h-24">
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Gift className="h-12 w-12 text-primary" aria-label={name} />
      )}
    </div>
  );
}
