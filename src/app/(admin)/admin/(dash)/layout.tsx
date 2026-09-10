import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logoutAction } from "../actions";
import { nnnEnabled } from "@/lib/nnn/client";

export default function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <Logo markClassName="h-5 w-auto" />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/admin" className="text-ink-soft hover:text-ink">
                Mașini
              </Link>
              <Link
                href="/admin/cars/new"
                className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white hover:bg-accent-deep"
              >
                + Adaugă mașină
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:block ${
                nnnEnabled()
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
              title="Starea integrării 999.md"
            >
              999.md: {nnnEnabled() ? "activ" : "simulare"}
            </span>
            <a
              href="/"
              target="_blank"
              className="text-sm text-ink-soft hover:text-ink"
            >
              Vezi site-ul ↗
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-ink-soft hover:text-accent"
              >
                Ieși
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
