'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { createMcpKey, getMcpKeys, revokeMcpKey } from '@/features/admin/api/mcp';
import McpCreatedKeyNotice from '@/features/admin/components/mcp/McpCreatedKeyNotice';
import McpKeyCreateForm from '@/features/admin/components/mcp/McpKeyCreateForm';
import McpKeyList from '@/features/admin/components/mcp/McpKeyList';
import { useAuthStore } from '@/features/auth/store';
import { API_BASE_URL } from '@/shared/lib/environment';
import { getPrefixedErrorMessage } from '@/shared/lib/errors';
import { queryKeys } from '@/shared/lib/queryKeys';
import Surface from '@/shared/ui/Surface';
import WindowSurface from '@/shared/ui/WindowSurface';
import type { McpKeyCreateRequest, McpKeyCreateResponse } from '@/shared/types';

const mcpUrl = `${API_BASE_URL.replace(/\/+$/, '')}/api/admin/mcp`;

function McpSettings({ memberId }: { memberId: number }) {
  const queryClient = useQueryClient();
  const [issuedKey, setIssuedKey] = useState<McpKeyCreateResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const keysQuery = useQuery({
    queryKey: queryKeys.mcp.keys(memberId),
    queryFn: getMcpKeys,
    retry: 0,
    staleTime: 0,
    gcTime: 0,
  });

  const invalidateKeys = () => queryClient.invalidateQueries({ queryKey: queryKeys.mcp.all });

  const revokeMutation = useMutation({
    mutationFn: revokeMcpKey,
    retry: false,
    onSuccess: (_, id) => {
      setConfirmingId(null);
      setIssuedKey((current) => current?.key.id === id ? null : current);
      void invalidateKeys();
      toast.success('연결 키가 폐기되었습니다.');
    },
    onError: (error) => toast.error(getPrefixedErrorMessage(error, '연결 키 폐기 실패')),
  });

  const handleCreate = async (request: McpKeyCreateRequest): Promise<boolean> => {
    if (isCreating || issuedKey) return false;
    setIsCreating(true);
    setCreateError(null);
    try {
      // Keep the one-time secret out of React Query's mutation cache and devtools.
      const result = await createMcpKey(request);
      setIssuedKey(result);
      void invalidateKeys();
      return true;
    } catch (error) {
      setCreateError(getPrefixedErrorMessage(error, '연결 키 발급 실패'));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      toast.success('MCP 연결 주소를 복사했습니다.');
    } catch {
      toast.error('복사하지 못했습니다. 연결 주소를 직접 선택해 복사해주세요.');
    }
  };

  return (
    <WindowSurface title="MCP Settings" subtitle="관리자 연결" bodyClassName="space-y-5 p-4 sm:p-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]"><KeyRound size={21} aria-hidden="true" /> MCP 연결</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Codex·Claude Code 등의 MCP 클라이언트에서 블로그를 조회하고 관리합니다.</p>
      </header>

      <Surface as="section" className="min-w-0 p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--color-text)]">클라이언트 연결 정보</h2>
        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-[var(--color-control)] px-3 py-3 text-xs leading-6 text-[var(--color-text)]">{mcpUrl}</code>
          <button type="button" onClick={() => void copyUrl()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--card-bg-strong)]"><Copy size={15} aria-hidden="true" /> 주소 복사</button>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--color-text-muted)]">
          <li>연결 키를 발급하고 클라이언트에서 HTTP (Streamable HTTP) MCP 서버를 추가하세요.</li>
          <li>서버 주소에 위 URL을 입력하고, 인증 헤더를 <code className="break-all text-xs">Authorization: Bearer &lt;발급한 연결 키&gt;</code>로 설정하세요.</li>
          <li>키는 클라이언트의 비밀 키 저장소 또는 환경 변수로 전달하세요. 읽기 및 쓰기 권한은 글을 변경할 때만 선택하세요.</li>
        </ol>
      </Surface>

      {issuedKey && <McpCreatedKeyNotice key={issuedKey.key.id} issuedKey={issuedKey} onDismiss={() => setIssuedKey(null)} />}

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        <McpKeyCreateForm isCreating={isCreating} hasNewKey={Boolean(issuedKey)} error={createError} onCreate={handleCreate} />
        <McpKeyList
          keys={keysQuery.data ?? []}
          now={now}
          isLoading={keysQuery.isLoading}
          isFetching={keysQuery.isFetching}
          error={keysQuery.isError ? getPrefixedErrorMessage(keysQuery.error, '연결 키 목록 조회 실패') : null}
          confirmingId={confirmingId}
          isRevoking={revokeMutation.isPending}
          onRefresh={() => void keysQuery.refetch()}
          onRequestRevoke={setConfirmingId}
          onConfirmRevoke={(id) => revokeMutation.mutate(id)}
        />
      </div>
    </WindowSurface>
  );
}

export default function AdminMcpPanel() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return <McpSettings key={`${user.memberId}:${user.email}`} memberId={user.memberId} />;
}
