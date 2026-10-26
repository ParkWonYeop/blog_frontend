'use client';

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import Surface from '@/shared/ui/Surface';
import type { McpKeyCreateRequest, McpKeyPermission } from '@/shared/types';

interface McpKeyCreateFormProps {
  isCreating: boolean;
  hasNewKey: boolean;
  error: string | null;
  onCreate: (request: McpKeyCreateRequest) => Promise<boolean>;
}

const inputClass = 'mt-1.5 w-full min-w-0 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 py-2.5 text-sm text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60';

export default function McpKeyCreateForm({ isCreating, hasNewKey, error, onCreate }: McpKeyCreateFormProps) {
  const [name, setName] = useState('');
  const [permission, setPermission] = useState<McpKeyPermission>('READ_ONLY');
  const [expiresInDays, setExpiresInDays] = useState('90');
  const [validationError, setValidationError] = useState<string | null>(null);
  const errorId = useId();
  const disabled = isCreating || hasNewKey;
  const displayedError = validationError || error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    const trimmedName = name.trim();
    const days = Number(expiresInDays);
    if (!trimmedName || trimmedName.length > 100) {
      setValidationError('키 이름을 1~100자로 입력해주세요.');
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setValidationError('유효 기간을 1~365일 사이의 정수로 입력해주세요.');
      return;
    }

    setValidationError(null);
    const created = await onCreate({ name: trimmedName, permission, expiresInDays: days });
    if (created) {
      setName('');
      setPermission('READ_ONLY');
      setExpiresInDays('90');
    }
  };

  return (
    <Surface as="section" className="min-w-0 p-4 sm:p-5">
      <h2 className="text-base font-bold text-[var(--color-text)]">새 연결 키</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">사용할 앱마다 키를 따로 만들면 연결을 개별적으로 해제할 수 있습니다.</p>
      <form onSubmit={handleSubmit} aria-describedby={displayedError ? errorId : undefined} className="mt-4 space-y-4">
        <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
          키 이름
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 내 노트북의 Codex"
            maxLength={100}
            required
            disabled={disabled}
            className={inputClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
            권한
            <select
              value={permission}
              onChange={(event) => setPermission(event.target.value === 'READ_WRITE' ? 'READ_WRITE' : 'READ_ONLY')}
              disabled={disabled}
              className={inputClass}
            >
              <option value="READ_ONLY">읽기 전용</option>
              <option value="READ_WRITE">읽기 및 쓰기</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
            유효 기간 (일)
            <input
              type="number"
              min={1}
              max={365}
              step={1}
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
              required
              disabled={disabled}
              className={inputClass}
            />
          </label>
        </div>
        <p className="text-xs leading-5 text-[var(--color-text-subtle)]">
          {permission === 'READ_WRITE'
            ? '읽기 및 쓰기 키는 글·카테고리·댓글·프로필을 변경하고 글·카테고리·댓글을 삭제할 수 있습니다.'
            : '읽기 전용 키는 글·카테고리·댓글·프로필 조회에만 사용합니다.'}
        </p>
        {displayedError && <p id={errorId} role="alert" className="text-sm text-[var(--color-danger)]">{displayedError}</p>}
        {hasNewKey && <p className="text-xs text-[var(--color-text-muted)]">발급된 키를 복사하고 안내를 닫으면 새 키를 만들 수 있습니다.</p>}
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
          {isCreating ? '발급 중…' : '연결 키 발급'}
        </button>
      </form>
    </Surface>
  );
}
