import Link from "next/link";

export default function MarketingHome() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        Event Classics
      </p>
      <h1 className="text-4xl md:text-6xl font-semibold max-w-3xl">
        Marketing site placeholder.
      </h1>
      <p className="text-zinc-400 max-w-xl">
        The prototype product lives under <code className="font-mono">/app</code>.
        Move the existing marketing homepage into this route group to preserve
        its visuals.
      </p>
      <Link
        href="/app"
        className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-5 text-sm font-medium text-black hover:bg-zinc-200"
      >
        Open CMO Studio
      </Link>
    </main>
  );
}