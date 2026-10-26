import { KeyRound, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { formatKoreanDateTime } from '@/shared/lib/dates';
import EmptyState from '@/shared/ui/EmptyState';
import StatusBadge from '@/shared/ui/StatusBadge';
import Surface from '@/shared/ui/Surface';
import type { McpKey } from '@/shared/types';

interface McpKeyListProps {
  keys: McpKey[];
  now: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  confirmingId: number | null;
  isRevoking: boolean;
  onRefresh: () => void;
  onRequestRevoke: (id: number | null) => void;
  onConfirmRevoke: (id: number) => void;
}

export default function McpKeyList({ keys, now, isLoading, isFetching, error, confirmingId, isRevoking, onRefresh, onRequestRevoke, onConfirmRevoke }: McpKeyListProps) {
  return (
    <Surface as="section" className="min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text)]">내 연결 키</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-subtle)]">폐기하면 해당 키로 연결한 앱의 접근이 즉시 차단됩니다.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={isFetching} aria-label="연결 키 목록 새로고침" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] hover:bg-[var(--card-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60">
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : undefined} aria-hidden="true" />
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {isLoading ? (
        <div role="status" className="flex min-h-36 items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" /> 연결 키를 불러오는 중…
        </div>
      ) : keys.length === 0 ? (
        <EmptyState title={error ? '연결 키를 불러오지 못했습니다.' : '아직 발급한 연결 키가 없습니다.'} description={error ? '새로고침 버튼으로 다시 시도해주세요.' : '읽기 전용 키를 만들어 블로그를 연결해보세요.'} icon={<KeyRound size={24} aria-hidden="true" />} />
      ) : (
        <ul className="divide-y divide-[var(--card-border)]">
          {keys.map((key) => {
            const expired = new Date(key.expiresAt).getTime() <= now;
            const confirming = confirmingId === key.id;

            return (
              <li key={key.id} className="min-w-0 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold text-[var(--color-text)]">{key.name}</h3>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--color-text-subtle)]">{key.tokenPrefix}…</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge tone={key.permission === 'READ_WRITE' ? 'warning' : 'info'}>{key.permission === 'READ_WRITE' ? '읽기 및 쓰기' : '읽기 전용'}</StatusBadge>
                      <StatusBadge tone={key.revokedAt ? 'neutral' : expired ? 'warning' : 'success'}>{key.revokedAt ? '폐기됨' : expired ? '만료됨' : '사용 가능'}</StatusBadge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-text-subtle)]">발급 {formatKoreanDateTime(key.createdAt)} · 만료 {formatKoreanDateTime(key.expiresAt)}</p>
                    {key.revokedAt && <p className="text-xs leading-5 text-[var(--color-text-subtle)]">폐기 {formatKoreanDateTime(key.revokedAt)}</p>}
                  </div>
                  {!key.revokedAt && !confirming && (
                    <button type="button" onClick={() => onRequestRevoke(key.id)} disabled={isRevoking} aria-label={`${key.name} 연결 키 폐기`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-500/20 bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300">
                      <Trash2 size={15} aria-hidden="true" /> 폐기
                    </button>
                  )}
                </div>
                {confirming && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-[var(--color-danger-soft)] p-3">
                    <p className="text-sm leading-6 text-[var(--color-text)]">이 키를 폐기할까요? 연결된 앱이 더 이상 이 키를 사용할 수 없으며 되돌릴 수 없습니다.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onConfirmRevoke(key.id)} disabled={isRevoking} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {isRevoking && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                        {isRevoking ? '폐기 중…' : '키 폐기 확인'}
                      </button>
                      <button type="button" onClick={() => onRequestRevoke(null)} disabled={isRevoking} className="min-h-11 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--card-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60">취소</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
