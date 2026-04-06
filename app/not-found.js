import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <p
        className="text-xs font-medium tracking-widest cr-red uppercase mb-6"
        style={{ letterSpacing: '0.15em' }}
      >
        Carnelian
      </p>
      <h1
        className="font-display text-4xl text-stone-800 mb-3 text-center"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
      >
        Not in the catalog.
      </h1>
      <p className="text-sm text-stone-400 mb-8 text-center max-w-sm leading-relaxed">
        This artifact doesn&apos;t exist in Carnelian yet. Search for something else, or request it.
      </p>
      <Link
        href="/"
        className="text-sm cr-red hover:underline underline-offset-2 transition-colors"
      >
        ← Back to search
      </Link>
    </main>
  );
}
