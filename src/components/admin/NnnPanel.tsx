"use client";

import { useActionState } from "react";
import {
  republishNnnAction,
  syncNnnAction,
  toggleNnnVisibilityAction,
} from "@/app/(admin)/admin/actions";
import type { SyncReport } from "@/lib/nnn/sync";

const ACTION_RO: Record<SyncReport["action"], string> = {
  created: "anunț creat",
  updated: "anunț actualizat",
  hidden: "ascuns pe 999.md",
  shown: "vizibil pe 999.md",
  "dry-run": "simulare",
  error: "eroare",
};

function ReportView({ report }: { report: SyncReport | undefined }) {
  if (!report) return null;
  return (
    <div
      className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
        report.ok ? "bg-green-50 text-green-800" : "bg-accent-soft text-accent-deep"
      }`}
    >
      {report.ok
        ? `OK: ${ACTION_RO[report.action]}${report.advertId && report.advertId !== "DRY-RUN" ? ` — #${report.advertId}` : ""}`
        : `Eroare: ${report.error}`}
      {report.warnings.length > 0 && (
        <span className="mt-1 block text-amber-700">
          {report.warnings.join(" · ")}
        </span>
      )}
    </div>
  );
}

const STATE_RO: Record<string, string> = {
  PENDING: "în așteptare",
  SYNCED: "sincronizat",
  DRY_RUN: "simulare",
  ERROR: "eroare",
  DISABLED: "dezactivat",
};

const NNN_STATE_RO: Record<string, string> = {
  public: "public",
  hidden: "ascuns",
  expired: "expirat",
  blocked: "blocat",
  blocked_commercial: "blocat (comercial)",
  need_pay: "necesită plată",
  deleted: "șters",
};

export function NnnPanel({
  carId,
  advert,
}: {
  carId: string;
  advert: {
    advertId: string | null;
    source: string;
    state: string;
    nnnState: string | null;
    lastError: string | null;
    lastSyncAt: string | null;
    url: string | null;
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
  const [visState, visAction, visPending] = useActionState<
    SyncReport | undefined,
    FormData
  >(toggleNnnVisibilityAction, undefined);

  const real = !!advert?.advertId && advert.advertId !== "DRY-RUN";
  const fromNnn = advert?.source === "nnn";
  const isPublic = advert?.nnnState !== "hidden";

  return (
    <aside className="sticky top-20 rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          999.md
        </h2>
        {advert && (
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
            {fromNnn ? "importat de pe 999.md" : "publicat de pe site"}
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-soft">Sincronizare</dt>
          <dd className="font-semibold">
            {advert ? STATE_RO[advert.state] ?? advert.state : "nepublicat"}
          </dd>
        </div>
        {real && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Anunț</dt>
            <dd className="font-semibold tabular-nums">
              {advert!.url ? (
                <a
                  href={advert!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  #{advert!.advertId} ↗
                </a>
              ) : (
                `#${advert!.advertId}`
              )}
            </dd>
          </div>
        )}
        {advert?.nnnState && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Pe 999.md</dt>
            <dd className="font-semibold">
              {NNN_STATE_RO[advert.nnnState] ?? advert.nnnState}
            </dd>
          </div>
        )}
        {advert?.lastSyncAt && (
          <div className="flex justify-between gap-3">
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
          className="btn-dark h-10 w-full rounded-lg text-sm disabled:opacity-60"
        >
          {syncPending
            ? "Se sincronizează..."
            : real
              ? "Trimite modificările pe 999.md"
              : "Publică pe 999.md"}
        </button>
      </form>
      <ReportView report={syncState} />

      {real && (
        <>
          <form action={repAction} className="mt-2">
            <input type="hidden" name="carId" value={carId} />
            <button
              type="submit"
              disabled={repPending}
              className="chip-3d h-10 w-full rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {repPending ? "..." : "Republică (ridică în listă)"}
            </button>
          </form>
          <ReportView report={repState} />

          <form action={visAction} className="mt-2">
            <input type="hidden" name="carId" value={carId} />
            <input type="hidden" name="advertId" value={advert!.advertId!} />
            <input type="hidden" name="policy" value={isPublic ? "private" : "public"} />
            <button
              type="submit"
              disabled={visPending}
              className="chip-3d h-10 w-full rounded-lg text-sm font-semibold text-ink-soft disabled:opacity-60"
            >
              {visPending ? "..." : isPublic ? "Ascunde anunțul pe 999.md" : "Arată anunțul pe 999.md"}
            </button>
          </form>
          <ReportView report={visState} />
        </>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        {fromNnn
          ? `Mașina a fost importată de pe 999.md. Modificările salvate aici se trimit înapoi pe 999.md dacă bifa „Publică / actualizează pe 999.md" e activă; altfel, la următorul import, specificațiile se reiau de pe 999.md.`
          : `Publicarea trimite anunțul cu titlu și descriere în română + rusă, fotografiile, dotările și toate caracteristicile către contul 999.md al firmei. Când marchezi mașina vândută sau rezervată, anunțul se ascunde automat pe 999.md.`}
      </p>
    </aside>
  );
}
