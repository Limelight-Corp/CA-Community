import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-bg">
      <h1 className="font-display text-4xl font-bold text-[var(--fg)]">404</h1>
      <p className="mt-2 text-lg text-[var(--muted)]">Page not found</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
