"use client";

import { useActionState } from "react";
import {
  republishNnnAction,
  syncNnnAction,
} from "@/app/(admin)/admin/actions";
import type { SyncReport } from "@/lib/nnn/sync";

function ReportView({ report }: { report: SyncReport | undefined }) {
  if (!report) return null;
  return (
    <div
      className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
        report.ok ? "bg-green-50 text-green-800" : "bg-accent-soft text-accent-deep"
      }`}
    >
      {report.ok
        ? `OK: ${report.action}${report.advertId ? ` — anunț #${report.advertId}` : ""}`
        : `Eroare: ${report.error}`}
      {report.warnings.length > 0 && (
        <span className="mt-1 block text-amber-700">
          {report.warnings.join(" · ")}
        </span>
      )}
    </div>
  );
}

export function NnnPanel({
  carId,
  advert,
}: {
  carId: string;
  advert: {
    advertId: string | null;
    state: string;
    lastError: string | null;
    lastSyncAt: string | null;
  } | null;
}) {
  const [syncState, syncAction, syncPending] = useActionState<
    SyncReport | undefined,
    FormData
  >(syncNnnAction, undefined);
  const [repState, repAction, repPending] = useActionState<
    SyncReport | undefined,
    FormData
  >(republishNnnAction, undefined);

  return (
    <aside className="sticky top-20 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide">
        999.md
      </h2>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Stare</dt>
          <dd className="font-semibold">{advert?.state ?? "nepublicat"}</dd>
        </div>
        {advert?.advertId && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">Anunț</dt>
            <dd className="font-semibold tabular-nums">#{advert.advertId}</dd>
          </div>
        )}
        {advert?.lastSyncAt && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">Ultima sincronizare</dt>
            <dd className="tabular-nums">
              {new Date(advert.lastSyncAt).toLocaleString("ro-RO")}
            </dd>
          </div>
        )}
      </dl>

      {advert?.lastError && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {advert.lastError}
        </p>
      )}

      <form action={syncAction} className="mt-4">
        <input type="hidden" name="carId" value={carId} />
        <button
          type="submit"
          disabled={syncPending}
          className="h-10 w-full rounded-lg bg-ink text-sm font-bold text-paper transition-colors hover:bg-black disabled:opacity-60"
        >
          {syncPending
            ? "Se sincronizează..."
            : advert?.advertId
              ? "Actualizează anunțul"
              : "Publică pe 999.md"}
        </button>
      </form>
      <ReportView report={syncState} />

      {advert?.advertId && advert.advertId !== "DRY-RUN" && (
        <>
          <form action={repAction} className="mt-2">
            <input type="hidden" name="carId" value={carId} />
            <button
              type="submit"
              disabled={repPending}
              className="h-10 w-full rounded-lg border border-line text-sm font-semibold transition-colors hover:border-ink disabled:opacity-60"
            >
              {repPending ? "..." : "Republică (ridică în listă)"}
            </button>
          </form>
          <ReportView report={repState} />
        </>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Publicarea trimite anunțul cu titlu și descriere în română + rusă,
        fotografiile și toate caracteristicile către contul 999.md al firmei.
      </p>
    </aside>
  );
}
