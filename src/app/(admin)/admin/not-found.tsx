import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo markClassName="h-12 w-auto" />
      <p className="mt-8 font-display text-5xl font-extrabold text-line">404</p>
      <p className="mt-3 text-sm text-ink-soft">
        Pagina nu există în panoul de administrare.
      </p>
      <Link href="/admin" className="btn-dark mt-6">
        Înapoi la mașini
      </Link>
    </div>
  );
}
