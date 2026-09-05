'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Chess as ChessGame, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { clsx } from 'clsx';
import { AlertCircle, ArrowUpDown, Clipboard, Flag, Handshake, Loader2, LockKeyhole, RotateCcw, Shuffle, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOnlineGame } from '@/features/chess/api';
import ChessBoard, { PIECE_SYMBOLS, getTurnLabel, toChessJsColor, type MoveSquares } from '@/features/chess/components/ChessBoard';
import ChessClock, { useNow } from '@/features/chess/components/ChessClock';
import ChessMoveList from '@/features/chess/components/ChessMoveList';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import ChessPromotionPicker from '@/features/chess/components/ChessPromotionPicker';
import { BOARD_SIZE_STYLE, getChessErrorMessage, getChessOutcomeLabel, isAuthError, outcomeBadgeTones } from '@/features/chess/components/chessUi';
import {
  START_FEN,
  getFenAtPly,
  getGameOverTitle,
  getKingInCheckSquare,
  getMaterial,
  getOutcomeFor,
  getTerminationLabel,
  pickMoveToSquare,
  replayMoves,
  toUciMove,
  type PromotionPiece,
} from '@/features/chess/lib';
import { useChessSocket, useChessSocketMessage, type ChessSocketStatus } from '@/features/chess/online/socket';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessColor, OnlineGameResponse, OnlinePlayerResponse, OnlineServerMessage } from '@/shared/types';

interface ChessOnlinePlayClientProps {
  gameId: string;
}

type Snapshot = {
  game: OnlineGameResponse;
  receivedAt: number;
};

type PendingPromotion = {
  from: Square;
  to: Square;
};

const createGame = (fen: string) => {
  try {
    return new ChessGame(fen);
  } catch {
    return null;
  }
};

const oppositeColor = (color: ChessColor): ChessColor => (color === 'white' ? 'black' : 'white');

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

const secondaryButtonClass =
  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50';

function Gate({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <ChessPageFrame title="온라인 대국" backHref="/chess/online" backLabel="Online">
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        {icon}
        <h2 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">{title}</h2>
        {children}
      </WindowSurface>
    </ChessPageFrame>
  );
}

function PlayerBar({
  player,
  color,
  isMe,
  captured,
  advantage,
  game,
  receivedAt,
}: {
  player: OnlinePlayerResponse;
  color: ChessColor;
  isMe: boolean;
  captured: PieceSymbol[];
  advantage: number;
  game: OnlineGameResponse;
  receivedAt: number;
}) {
  const capturedColor: Color = color === 'white' ? 'b' : 'w';
  const onTurn = game.status === 'IN_PROGRESS' && game.turn === color;
  const countdownActive = !player.connected && onTurn && game.forfeitDeadlineAt !== null;
  const now = useNow(500, countdownActive);
  const forfeitSeconds = countdownActive && game.forfeitDeadlineAt !== null
    ? Math.max(0, Math.ceil((game.forfeitDeadlineAt - (game.serverTime + (now - receivedAt))) / 1000))
    : null;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={clsx(
            'h-2.5 w-2.5 shrink-0 rounded-full border',
            color === 'white' ? 'border-black/20 bg-white' : 'border-white/30 bg-[#151922]',
            onTurn && 'ring-2 ring-emerald-500/60',
          )}
          aria-hidden="true"
        />
        <span className="truncate text-sm font-semibold text-[var(--color-text)]">
          {player.nickname}
          {isMe && <span className="ml-1 text-xs font-medium text-[var(--color-text-subtle)]">(나)</span>}
        </span>
        {!player.connected && game.status === 'IN_PROGRESS' && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
            <WifiOff size={12} />
            연결 끊김{forfeitSeconds !== null && ` · ${forfeitSeconds}초`}
          </span>
        )}
        <span className="truncate font-serif text-base leading-none text-[var(--color-text-muted)]">
          {captured.map((piece) => PIECE_SYMBOLS[capturedColor][piece]).join('')}
        </span>
        {advantage > 0 && <span className="text-xs font-bold tabular-nums text-[var(--color-text-subtle)]">+{advantage}</span>}
      </div>
      <ChessClock
        millis={color === 'white' ? game.whiteMillis : game.blackMillis}
        receivedAt={receivedAt}
        running={game.clockRunning && game.turn === color}
        active={onTurn}
      />
    </div>
  );
}

const connectionLabel: Record<ChessSocketStatus, string | null> = {
  idle: null,
  connecting: '서버에 연결하는 중입니다.',
  open: '서버에 연결하는 중입니다.',
  ready: null,
  closed: '연결이 끊겨 다시 연결하는 중입니다.',
  replaced: '다른 창에서 접속되어 이 창의 연결이 끊겼습니다.',
};

export default function ChessOnlinePlayClient({ gameId }: ChessOnlinePlayClientProps) {
  const { isLoggedIn, _hasHydrated, user } = useAuthStore();

  if (!_hasHydrated) return null;
  if (!isLoggedIn) {
    return (
      <Gate icon={<LockKeyhole className="mb-3 text-[var(--color-accent)]" size={30} />} title="로그인이 필요합니다.">
        <Link
          href={`/login?redirect=/chess/online/${gameId}`}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          로그인
        </Link>
      </Gate>
    );
  }

  return <OnlineGame gameId={gameId} initialMemberId={user?.memberId ?? null} />;
}

function OnlineGame({ gameId, initialMemberId }: { gameId: string; initialMemberId: number | null }) {
  const { status: socketStatus, send, reconnect } = useChessSocket();
  const [memberId, setMemberId] = useState<number | null>(initialMemberId);
  const [socketSnapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [optimisticMoveSquares, setOptimisticMoveSquares] = useState<MoveSquares | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  const gameQuery = useQuery({
    queryKey: queryKeys.chess.online.game(gameId),
    queryFn: () => getOnlineGame(gameId),
    retry: 0,
  });

  useEffect(() => {
    if (socketStatus === 'ready') send({ type: 'SUBSCRIBE', gameId });
  }, [gameId, send, socketStatus]);

  useChessSocketMessage(
    useCallback((message: OnlineServerMessage) => {
      if (message.type === 'AUTH_OK') setMemberId(message.memberId);
      if (message.type === 'GAME_STATE' && message.game.gameId === gameId) {
        setSnapshot({ game: message.game, receivedAt: Date.now() });
        setOptimisticFen(null);
        setOptimisticMoveSquares(null);
        setSelectedSquare(null);
        setPendingPromotion(null);
        setViewPly(null);
      }
      if (message.type === 'ERROR') {
        setOptimisticFen(null);
        setOptimisticMoveSquares(null);
        setSelectedSquare(null);
        setPendingPromotion(null);
        toast.error(message.message);
      }
    }, [gameId]),
  );

  // 소켓으로 받은 최신 상태가 없으면 REST로 읽은 초기 상태를 쓴다.
  const snapshot: Snapshot | null = socketSnapshot ?? (gameQuery.data ? { game: gameQuery.data, receivedAt: gameQuery.dataUpdatedAt } : null);
  const game = snapshot?.game ?? null;
  const receivedAt = snapshot?.receivedAt ?? 0;
  const myColor: ChessColor | null = game && memberId !== null
    ? game.white.memberId === memberId ? 'white' : game.black.memberId === memberId ? 'black' : null
    : null;
  const history = useMemo(() => replayMoves(game?.moves ?? []), [game?.moves]);
  const livePly = history.length;
  const isReviewing = viewPly !== null && viewPly < livePly;
  const currentPly = isReviewing ? viewPly : livePly;
  const liveFen = optimisticFen ?? game?.fen ?? START_FEN;
  const displayFen = isReviewing ? getFenAtPly(history, viewPly) : liveFen;
  const displayGame = useMemo(() => createGame(displayFen), [displayFen]);
  const playerColor = myColor ? toChessJsColor(myColor) : null;
  const inProgress = game?.status === 'IN_PROGRESS';
  const canInteract =
    Boolean(game && displayGame && playerColor) &&
    inProgress &&
    game?.turn === myColor &&
    socketStatus === 'ready' &&
    !optimisticFen &&
    !isReviewing &&
    !pendingPromotion;

  const legalMoves = useMemo<Move[]>(() => {
    if (!displayGame || !selectedSquare || !canInteract) return [];

    return displayGame.moves({ square: selectedSquare, verbose: true });
  }, [canInteract, displayGame, selectedSquare]);

  const legalTargets = useMemo(() => new Set(legalMoves.map((move) => move.to)), [legalMoves]);
  const reviewedEntry = isReviewing && viewPly > 0 ? history[viewPly - 1] : null;
  const lastEntry = history[history.length - 1];
  const lastMoveSquares: MoveSquares | null = isReviewing
    ? reviewedEntry
      ? { from: reviewedEntry.from, to: reviewedEntry.to }
      : null
    : optimisticMoveSquares ?? (lastEntry ? { from: lastEntry.from, to: lastEntry.to } : null);
  const checkSquare = useMemo(() => getKingInCheckSquare(displayGame), [displayGame]);
  const material = useMemo(() => getMaterial(displayFen), [displayFen]);
  const orientation: ChessColor = flipped ? oppositeColor(myColor ?? 'white') : myColor ?? 'white';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      const goTo = (ply: number) => {
        event.preventDefault();
        setSelectedSquare(null);
        setViewPly(Math.min(Math.max(ply, 0), livePly));
      };

      switch (event.key) {
        case 'ArrowLeft':
          goTo(currentPly - 1);
          break;
        case 'ArrowRight':
          goTo(currentPly + 1);
          break;
        case 'Home':
          goTo(0);
          break;
        case 'End':
          goTo(livePly);
          break;
        case 'f':
        case 'F':
          setFlipped((previous) => !previous);
          break;
        default:
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, livePly]);

  const isOwnTurnPiece = (square: Square) => {
    if (!displayGame || !playerColor || !canInteract) return false;

    const piece = displayGame.get(square);

    return piece?.color === playerColor && piece.color === displayGame.turn();
  };

  const commitMove = (move: Move) => {
    try {
      const nextGame = new ChessGame(liveFen);
      nextGame.move({ from: move.from, to: move.to, promotion: move.promotion });

      setOptimisticFen(nextGame.fen());
      setOptimisticMoveSquares({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPendingPromotion(null);
      if (!send({ type: 'MOVE', gameId, move: toUciMove(move) })) {
        setOptimisticFen(null);
        setOptimisticMoveSquares(null);
        toast.error('서버와 연결되어 있지 않습니다.');
      }
    } catch {
      setOptimisticMoveSquares(null);
      setPendingPromotion(null);
      toast.error('합법적인 수가 아닙니다.');
    }
  };

  const attemptMove = (from: Square, to: Square) => {
    if (!displayGame || !canInteract || !isOwnTurnPiece(from)) return;

    const { move, needsPromotion } = pickMoveToSquare(displayGame.moves({ square: from, verbose: true }), to);

    if (needsPromotion) {
      setSelectedSquare(null);
      setPendingPromotion({ from, to });
      return;
    }

    if (!move) {
      setSelectedSquare(null);
      toast.error('그 칸으로는 이동할 수 없습니다.');
      return;
    }

    commitMove(move);
  };

  const handlePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion || !displayGame) return;

    const move = displayGame
      .moves({ square: pendingPromotion.from, verbose: true })
      .find((candidate) => candidate.to === pendingPromotion.to && candidate.promotion === piece);

    if (!move) {
      setPendingPromotion(null);
      toast.error('합법적인 수가 아닙니다.');
      return;
    }

    commitMove(move);
  };

  const handleSquareClick = (square: Square) => {
    if (isReviewing) {
      setViewPly(null);
      return;
    }
    if (!displayGame || !canInteract) return;

    const piece = displayGame.get(square);
    const isSelectablePiece = piece?.color === playerColor && piece.color === displayGame.turn();

    if (!selectedSquare) {
      if (isSelectablePiece) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (legalTargets.has(square)) {
      attemptMove(selectedSquare, square);
      return;
    }

    if (isSelectablePiece) {
      setSelectedSquare(square);
      return;
    }

    setSelectedSquare(null);
  };

  const handleResign = () => {
    if (!window.confirm('정말 기권하시겠습니까?')) return;
    send({ type: 'RESIGN', gameId });
  };

  const copyPgn = () => {
    if (!game?.pgn) return;
    void navigator.clipboard.writeText(game.pgn)
      .then(() => toast.success('PGN을 복사했습니다.'))
      .catch(() => toast.error('PGN 복사에 실패했습니다.'));
  };

  if (gameQuery.isError) {
    if (isAuthError(gameQuery.error)) {
      return (
        <Gate icon={<LockKeyhole className="mb-3 text-[var(--color-accent)]" size={30} />} title="로그인이 필요합니다.">
          <Link href={`/login?redirect=/chess/online/${gameId}`} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white">
            로그인
          </Link>
        </Gate>
      );
    }
    return (
      <Gate icon={<AlertCircle className="mb-3 text-red-500" size={30} />} title="대국을 불러오지 못했습니다.">
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{getChessErrorMessage(gameQuery.error, '')}</p>
        <button type="button" onClick={() => void gameQuery.refetch()} className={`${secondaryButtonClass} mt-6`}>
          <RotateCcw size={16} />
          다시 시도
        </button>
      </Gate>
    );
  }

  if (!game || !myColor) {
    return (
      <Gate icon={<Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />} title="대국을 불러오는 중입니다." />
    );
  }

  const opponentColor = oppositeColor(myColor);
  const me = game[myColor];
  const opponent = game[opponentColor];
  const outcome = getOutcomeFor(game.result, myColor, game.status);
  const topColor: ChessColor = orientation === 'white' ? 'black' : 'white';
  const bottomColor: ChessColor = orientation === 'white' ? 'white' : 'black';
  const barFor = (color: ChessColor) => (
    <PlayerBar
      player={color === myColor ? me : opponent}
      color={color}
      isMe={color === myColor}
      captured={color === 'white' ? material.capturedByWhite : material.capturedByBlack}
      advantage={color === 'white' ? material.whiteAdvantage : -material.whiteAdvantage}
      game={game}
      receivedAt={receivedAt}
    />
  );
  const connectionNotice = connectionLabel[socketStatus];
  const boardSubtitle = isReviewing
    ? `Reviewing ${currentPly} / ${livePly}`
    : !inProgress
      ? 'Finished'
      : game.turn === myColor
        ? checkSquare
          ? 'Check!'
          : 'Your move'
        : 'Waiting';

  return (
    <ChessPageFrame title="온라인 대국" backHref="/chess/online" backLabel="Online">
      {connectionNotice && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          <span className="inline-flex items-center gap-2">
            {socketStatus === 'replaced' ? <WifiOff size={16} /> : <Loader2 className="animate-spin" size={16} />}
            {connectionNotice}
          </span>
          {socketStatus === 'replaced' && (
            <button type="button" onClick={reconnect} className="underline underline-offset-2">
              이 창에서 계속
            </button>
          )}
        </div>
      )}

      <section className="grid min-w-0 items-start justify-center gap-5 xl:grid-cols-[minmax(0,40rem)_22rem]">
        <WindowSurface
          title="Board"
          subtitle={boardSubtitle}
          showTrafficLights={false}
          controls={(
            <button
              type="button"
              onClick={() => setFlipped((previous) => !previous)}
              aria-pressed={flipped}
              aria-label="보드 뒤집기"
              title="보드 뒤집기 (F)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <ArrowUpDown size={15} />
            </button>
          )}
          bodyClassName="p-2 md:p-3"
        >
          <div className="mx-auto max-w-full" style={BOARD_SIZE_STYLE}>
            {barFor(topColor)}
            <div className="relative">
              <ChessBoard
                fen={displayFen}
                orientation={orientation}
                selectedSquare={selectedSquare}
                legalTargets={legalTargets}
                lastMoveSquares={lastMoveSquares}
                checkSquare={checkSquare}
                disabled={!canInteract}
                isDraggableSquare={isOwnTurnPiece}
                onSquareClick={handleSquareClick}
                onSquareDrop={attemptMove}
              />
              {pendingPromotion && playerColor && (
                <ChessPromotionPicker color={playerColor} onSelect={handlePromotion} onCancel={() => setPendingPromotion(null)} />
              )}
              {isReviewing && (
                <button
                  type="button"
                  onClick={() => setViewPly(null)}
                  className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/25 bg-black/62 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(0_0_0_/_0.28)] backdrop-blur-md transition hover:bg-black/75"
                >
                  {currentPly}수 국면 보는 중 · 현재로 돌아가기
                </button>
              )}
            </div>
            {barFor(bottomColor)}
          </div>
        </WindowSurface>

        <WindowSurface title="Game Info" showTrafficLights={false} as="aside" bodyClassName="p-4 md:p-5">
          <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge tone={outcomeBadgeTones[outcome]}>{getChessOutcomeLabel(outcome)}</StatusBadge>
            <StatusBadge tone="neutral">{game.timeControl.label}</StatusBadge>
            {!inProgress && <StatusBadge tone="neutral">{getTerminationLabel(game.status)}</StatusBadge>}
            {game.result && <StatusBadge tone="neutral">{game.result}</StatusBadge>}
          </div>

          {inProgress ? (
            <>
              <div
                className={clsx(
                  'rounded-lg border px-3 py-3 text-sm font-semibold leading-6',
                  game.turn === myColor
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
                )}
              >
                {game.turn === myColor ? '내 차례입니다.' : `${opponent.nickname} 차례입니다.`}
                {!game.clockRunning && ' 백의 첫 수 전까지 시계는 멈춰 있습니다.'}
              </div>

              {game.drawOfferedBy === opponentColor && (
                <div className="mt-3 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-3 py-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{opponent.nickname}님이 무승부를 제안했습니다.</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => send({ type: 'DRAW_ACCEPT', gameId })} className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-xs font-semibold text-white">
                      수락
                    </button>
                    <button type="button" onClick={() => send({ type: 'DRAW_DECLINE', gameId })} className={`${secondaryButtonClass} h-9 text-xs`}>
                      거절
                    </button>
                  </div>
                </div>
              )}
              {game.drawOfferedBy === myColor && (
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-subtle)]">무승부를 제안했습니다. 상대 응답을 기다리는 중입니다.</p>
              )}
            </>
          ) : (
            <div
              className={clsx(
                'rounded-lg border px-3 py-3',
                outcome === 'WIN' && 'border-emerald-500/25 bg-emerald-500/10',
                outcome === 'LOSS' && 'border-red-500/20 bg-red-500/10',
                outcome !== 'WIN' && outcome !== 'LOSS' && 'border-[var(--color-line)] bg-black/[0.025] dark:bg-white/[0.06]',
              )}
            >
              <p className="text-base font-bold text-[var(--color-text)]">
                {outcome === 'UNKNOWN' ? '대국이 무효 처리되었습니다.' : getGameOverTitle(outcome, game.status).replace('Maia가', `${opponent.nickname}님이`)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {getTerminationLabel(game.status)} · {history.length}수
              </p>
              <Link
                href="/chess/online"
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                <Shuffle size={14} />
                새 대국 찾기
              </Link>
            </div>
          )}

          <div className="mt-4">
            <ChessMoveList history={history} currentPly={currentPly} onSelectPly={(ply) => { setSelectedSquare(null); setViewPly(ply >= livePly ? null : Math.max(ply, 0)); }} />
          </div>

          {inProgress && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => send({ type: 'DRAW_OFFER', gameId })}
                disabled={socketStatus !== 'ready' || game.drawOfferedBy === myColor}
                className={secondaryButtonClass}
              >
                <Handshake size={16} />
                무승부 제안
              </button>
              <button
                type="button"
                onClick={handleResign}
                disabled={socketStatus !== 'ready'}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-sm font-semibold text-red-700 shadow-[var(--shadow-control)] transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
              >
                <Flag size={16} />
                기권
              </button>
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">내 색상</dt>
              <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{getTurnLabel(myColor)}</dd>
            </div>
            <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">상대</dt>
              <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{opponent.nickname}</dd>
            </div>
          </dl>

          <details className="mt-4 rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-[var(--color-text)]">
              PGN
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  copyPgn();
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
              >
                <Clipboard size={14} />
                복사
              </button>
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
              {game.pgn || 'PGN이 아직 없습니다.'}
            </pre>
          </details>
        </WindowSurface>
      </section>
    </ChessPageFrame>
  );
}
