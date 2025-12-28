import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );
}