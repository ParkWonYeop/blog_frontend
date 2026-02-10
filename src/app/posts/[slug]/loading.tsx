import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
    </div>
  );
}
