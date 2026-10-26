export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] animate-pulse md:pt-4" aria-busy="true" aria-label="글을 불러오는 중">
      <div className="h-5 w-20 rounded-md bg-[var(--color-surface)]" />
      <div className="mt-4 h-10 w-4/5 rounded-lg bg-[var(--color-surface)]" />
      <div className="mt-3 h-10 w-3/5 rounded-lg bg-[var(--color-surface)]" />
      <div className="mt-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-[var(--color-surface)]" />
        <div className="h-4 w-32 rounded-md bg-[var(--color-surface)]" />
      </div>
      <div className="mt-12 space-y-3">
        {[100, 96, 88, 92, 60].map((width) => (
          <div key={width} className="h-4 rounded-md bg-[var(--color-surface)]" style={{ width: `${width}%` }} />
        ))}
      </div>
    </div>
  );
}
