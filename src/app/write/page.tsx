'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function LegacyWriteRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const editSlug = searchParams.get('slug');
    router.replace(editSlug ? `/admin/posts/${editSlug}/edit` : '/admin/posts/new');
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={36} />
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <LegacyWriteRedirect />
    </Suspense>
  );
}
