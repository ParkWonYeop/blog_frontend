'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Copy, Link as LinkIcon, Loader2, LockKeyhole, Shuffle, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getActiveOnlineGame } from '@/features/chess/api';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import { TIME_CONTROLS } from '@/features/chess/lib';
import { useChessSocket, useChessSocketMessage, type ChessSocketStatus } from '@/features/chess/online/socket';
import SegmentedControl, { SegmentedControlOption } from '@/shared/ui/SegmentedControl';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { OnlineServerMessage, TimeControlKey } from '@/shared/types';

const LOBBY_PATH = '/chess/online';

const TIME_CONTROL_OPTIONS: readonly SegmentedControlOption<TimeControlKey>[] = TIME_CONTROLS.map((control) => ({
  label: control.label,
  value: control.key,
}));

const primaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50';

const socketStatusLabel: Record<ChessSocketStatus, string> = {
  idle: '연결 대기',
  connecting: '연결 중',
  open: '인증 중',
  ready: '연결됨',
  closed: '연결 끊김 · 다시 연결 중',
  replaced: '다른 창에서 접속됨',
};

function LoginRequired() {
  return (
    <ChessPageFrame title="Online" backHref="/chess" backLabel="체스">
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <LockKeyhole className="mb-3 text-[var(--color-accent)]" size={30} />
        <h2 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h2>
        <Link
          href={`/login?redirect=${LOBBY_PATH}`}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          로그인
        </Link>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function LoadingGate() {
  return (
    <ChessPageFrame title="Online" backHref="/chess" backLabel="체스">
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
        <p className="text-sm font-semibold text-[var(--color-text)]">진행 중인 대국을 확인하는 중입니다.</p>
      </WindowSurface>
    </ChessPageFrame>
  );
}

export default function ChessOnlineLobbyClient() {
  const { isLoggedIn, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return null;
  if (!isLoggedIn) return <LoginRequired />;

  return <ActiveGameGate />;
}

/** 진행 중인 대국이 있으면 로비 대신 그 대국으로 보낸다. 끝난 대국은 해당되지 않는다. */
function ActiveGameGate() {
  const router = useRouter();
  const activeQuery = useQuery({
    queryKey: queryKeys.chess.online.active,
    queryFn: getActiveOnlineGame,
    retry: 0,
    staleTime: 0,
    gcTime: 0,
  });
  const activeGameId = activeQuery.data?.gameId ?? null;

  useEffect(() => {
    if (activeGameId) router.replace(`/chess/online/${activeGameId}`);
  }, [activeGameId, router]);

  if (activeQuery.isLoading || activeGameId) return <LoadingGate />;

  return <OnlineLobby onMatch={(gameId) => router.push(`/chess/online/${gameId}`)} />;
}

function OnlineLobby({ onMatch }: { onMatch: (gameId: string) => void }) {
  const { status, send, reconnect } = useChessSocket();
  const [timeControl, setTimeControl] = useState<TimeControlKey>('BLITZ_3');
  const [queued, setQueued] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const isReady = status === 'ready';

  useChessSocketMessage(
    useCallback((message: OnlineServerMessage) => {
      switch (message.type) {
        case 'QUEUE_JOINED':
          setQueued(true);
          break;
        case 'QUEUE_LEFT':
          setQueued(false);
          break;
        case 'INVITE_CREATED':
          setInviteCode(message.code);
          break;
        case 'INVITE_CANCELLED':
          setInviteCode(null);
          break;
        case 'MATCH_FOUND':
          onMatch(message.gameId);
          break;
        case 'ERROR':
          setJoining(false);
          toast.error(message.message);
          break;
        default:
      }
    }, [onMatch]),
  );

  const inviteLink = inviteCode && typeof window !== 'undefined' ? `${window.location.origin}/chess/online/join/${inviteCode}` : '';

  const copy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label}를 복사했습니다.`))
      .catch(() => toast.error('복사하지 못했습니다.'));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast.error('초대 코드를 입력하세요.');
      return;
    }
    setJoining(true);
    send({ type: 'INVITE_JOIN', code });
  };

  return (
    <ChessPageFrame
      title="Online"
      backHref="/chess"
      backLabel="체스"
      actions={(
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)]">
          <span
            className={clsx(
              'h-2 w-2 rounded-full',
              isReady ? 'bg-emerald-500' : status === 'replaced' ? 'bg-red-500' : 'bg-amber-500',
            )}
            aria-hidden="true"
          />
          {socketStatusLabel[status]}
          {status === 'replaced' && (
            <button type="button" onClick={reconnect} className="underline underline-offset-2 hover:text-[var(--color-text)]">
              이 창에서 계속
            </button>
          )}
        </span>
      )}
    >
      <WindowSurface title="Time Control" showTrafficLights={false} bodyClassName="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            ariaLabel="시간 설정"
            options={TIME_CONTROL_OPTIONS}
            value={timeControl}
            onChange={setTimeControl}
            className="max-w-full overflow-x-auto"
          />
          <span className="text-xs font-semibold text-[var(--color-text-subtle)]">
            {TIME_CONTROLS.find((control) => control.key === timeControl)?.description}
          </span>
        </div>
      </WindowSurface>

      <section className="grid min-w-0 items-start gap-5 md:grid-cols-2">
        <WindowSurface title="Random" showTrafficLights={false} bodyClassName="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-[var(--color-text)]">
            <Shuffle size={18} className="text-[var(--color-accent)]" />
            <span className="text-base font-bold">랜덤 매칭</span>
          </div>
          {queued ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-4 py-6 text-center dark:bg-white/[0.06]">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={26} />
              <p className="text-sm font-semibold text-[var(--color-text)]">상대를 찾는 중입니다.</p>
              <button type="button" onClick={() => send({ type: 'QUEUE_LEAVE' })} className={secondaryButtonClass}>
                <X size={16} />
                취소
              </button>
            </div>
          ) : (
            <button type="button" disabled={!isReady} onClick={() => send({ type: 'QUEUE_JOIN', timeControl })} className={primaryButtonClass}>
              <Shuffle size={18} />
              대기열 참가
            </button>
          )}
        </WindowSurface>

        <WindowSurface title="Invite" showTrafficLights={false} bodyClassName="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-[var(--color-text)]">
            <Users size={18} className="text-[var(--color-accent)]" />
            <span className="text-base font-bold">초대</span>
          </div>

          {inviteCode ? (
            <div className="rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-4 py-4 dark:bg-white/[0.06]">
              <p className="text-center font-mono text-3xl font-bold tracking-[0.3em] text-[var(--color-text)]">{inviteCode}</p>
              <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)]">
                <Loader2 className="animate-spin" size={13} />
                상대가 참가하면 바로 시작됩니다.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => copy(inviteCode, '코드')} className={secondaryButtonClass}>
                  <Copy size={15} />
                  코드
                </button>
                <button type="button" onClick={() => copy(inviteLink, '링크')} className={secondaryButtonClass}>
                  <LinkIcon size={15} />
                  링크
                </button>
                <button type="button" onClick={() => send({ type: 'INVITE_CANCEL' })} className={secondaryButtonClass}>
                  <X size={15} />
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={!isReady} onClick={() => send({ type: 'INVITE_CREATE', timeControl })} className={primaryButtonClass}>
              <Users size={18} />
              초대 코드 만들기
            </button>
          )}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleJoin();
            }}
          >
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="초대 코드"
              maxLength={8}
              aria-label="초대 코드"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
            />
            <button type="submit" disabled={!isReady || joining} className={secondaryButtonClass}>
              {joining ? <Loader2 className="animate-spin" size={16} /> : null}
              참가
            </button>
          </form>
        </WindowSurface>
      </section>
    </ChessPageFrame>
  );
}
