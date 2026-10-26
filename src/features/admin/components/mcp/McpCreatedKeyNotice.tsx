'use client';

import { useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Surface from '@/shared/ui/Surface';
import type { McpKeyCreateResponse } from '@/shared/types';

export default function McpCreatedKeyNotice({ issuedKey, onDismiss }: {
  issuedKey: McpKeyCreateResponse;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const tokenId = useId();

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(issuedKey.token);
      setCopied(true);
      toast.success('연결 키를 복사했습니다.');
    } catch {
      toast.error('복사하지 못했습니다. 아래 키를 직접 선택해 복사해주세요.');
    }
  };

  return (
    <Surface as="section" className="min-w-0 border-[var(--color-accent)] p-4 sm:p-5">
      <h2 className="text-base font-bold text-[var(--color-text)]" role="status">연결 키가 발급되었습니다</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">이 키는 지금 한 번만 표시됩니다. 복사해 클라이언트의 비밀 키 저장소나 환경 변수에 보관하세요. 안내를 닫거나 페이지를 떠나면 다시 볼 수 없습니다.</p>
      <label htmlFor={tokenId} className="mt-4 block text-sm font-semibold text-[var(--color-text)]">{issuedKey.key.name} 연결 키</label>
      <textarea
        id={tokenId}
        value={issuedKey.token}
        readOnly
        rows={3}
        spellCheck={false}
        autoComplete="off"
        className="mt-2 w-full min-w-0 resize-none break-all rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] p-3 font-mono text-sm text-[var(--color-text)]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyToken()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]">
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? '복사됨 · 다시 복사' : '키 복사'}
        </button>
        <button type="button" onClick={onDismiss} className="min-h-11 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--card-bg-strong)]">확인 후 닫기</button>
      </div>
    </Surface>
  );
}
