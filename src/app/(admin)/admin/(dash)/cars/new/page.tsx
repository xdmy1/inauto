import Link from "next/link";
import { CarForm } from "@/components/admin/CarForm";

export default function NewCarPage() {
  return (
    <div>
      <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
        ← Înapoi la listă
      </Link>
      <h1 className="mt-2 font-display text-2xl font-extrabold">
        Adaugă mașină
      </h1>
      <div className="mt-6">
        <CarForm car={null} />
      </div>
    </div>
  );
}
