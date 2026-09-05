'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, LockKeyhole } from 'lucide-react';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import { useChessSocket, useChessSocketMessage } from '@/features/chess/online/socket';
import WindowSurface from '@/shared/ui/WindowSurface';
import { useAuthStore } from '@/features/auth/store';
import type { OnlineServerMessage } from '@/shared/types';

interface ChessOnlineJoinClientProps {
  code: string;
}

export default function ChessOnlineJoinClient({ code }: ChessOnlineJoinClientProps) {
  const { isLoggedIn, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return null;

  if (!isLoggedIn) {
    return (
      <ChessPageFrame title="초대" backHref="/chess/online" backLabel="Online">
        <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <LockKeyhole className="mb-3 text-[var(--color-accent)]" size={30} />
          <h2 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h2>
          <Link
            href={`/login?redirect=/chess/online/join/${encodeURIComponent(code)}`}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            로그인
          </Link>
        </WindowSurface>
      </ChessPageFrame>
    );
  }

  return <JoinByCode code={code} />;
}

function JoinByCode({ code }: ChessOnlineJoinClientProps) {
  const router = useRouter();
  const { status, send } = useChessSocket();
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (status !== 'ready' || sentRef.current) return;
    sentRef.current = true;
    send({ type: 'INVITE_JOIN', code: code.toUpperCase() });
  }, [code, send, status]);

  useChessSocketMessage(
    useCallback((message: OnlineServerMessage) => {
      if (message.type === 'MATCH_FOUND') router.replace(`/chess/online/${message.gameId}`);
      if (message.type === 'ERROR') setError(message.message);
    }, [router]),
  );

  return (
    <ChessPageFrame title="초대" backHref="/chess/online" backLabel="Online">
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        {error ? (
          <>
            <AlertCircle className="mb-3 text-red-500" size={30} />
            <p className="text-base font-bold text-[var(--color-text)]">{error}</p>
            <Link
              href="/chess/online"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Online으로
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-[var(--color-text)]">{code.toUpperCase()}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">참가하는 중입니다.</p>
          </>
        )}
      </WindowSurface>
    </ChessPageFrame>
  );
}
