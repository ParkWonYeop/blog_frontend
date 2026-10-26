import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <p className="font-pixel text-[96px] leading-none text-[var(--color-text)]" aria-hidden="true">404</p>
      <h1 className="mt-6 text-title3 font-bold text-[var(--color-text)]">페이지를 찾을 수 없어요</h1>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-[var(--color-accent)] px-6 text-body1 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        홈으로
      </Link>
    </div>
  );
}
