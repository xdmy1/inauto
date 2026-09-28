import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logoutAction } from "../actions";

export default function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Link href="/admin" className="shrink-0">
              <Logo markClassName="h-9 w-auto" />
            </Link>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <nav className="flex items-center gap-1 text-sm font-semibold">
              <Link href="/admin" className="rounded-lg px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink">
                Mașini
              </Link>
              <Link
                href="/admin/cars/new"
                className="hidden rounded-lg px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink sm:block"
              >
                Adaugă mașină
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            <a
              href="/"
              target="_blank"
              className="rounded-lg px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink"
            >
              Site-ul ↗
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-accent"
              >
                Ieși
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
