"use client";

import { useActionState } from "react";
import { importNnnAction } from "@/app/(admin)/admin/actions";
import type { ImportReport } from "@/lib/nnn/import";
import type { NnnMode } from "@/lib/nnn/client";

const MODE_LABEL: Record<NnnMode, { label: string; text: string; cls: string }> = {
  live: {
    label: "activ",
    text: "Sincronizare în ambele sensuri: ce publici aici apare pe 999.md, ce postezi pe 999.md apare aici.",
    cls: "bg-green-100 text-green-800",
  },
  "read-only": {
    label: "doar import",
    text: "Cheia API e setată, dar NNN_DRY_RUN=1: anunțurile de pe 999.md se importă, postarea de pe site e simulată.",
    cls: "bg-amber-100 text-amber-800",
  },
  off: {
    label: "simulare",
    text: "Fără cheie API. Cere cheia pentru contul firmei la info@999.md și pune-o în .env (NNN_API_KEY), apoi NNN_DRY_RUN=0.",
    cls: "bg-gray-100 text-gray-600",
  },
};

export function NnnImportPanel({
  mode,
  lastRun,
  fromNnn,
  fromSite,
}: {
  mode: NnnMode;
  lastRun: {
    startedAt: string;
    ok: boolean;
    trigger: string;
    summary: string | null;
    error: string | null;
    details: string | null;
  } | null;
  fromNnn: number;
  fromSite: number;
}) {
  const [report, action, pending] = useActionState<ImportReport | undefined>(
    importNnnAction,
    undefined
  );
  const m = MODE_LABEL[mode];
  const warnings = report?.warnings ?? lastRun?.details?.split("\n").filter(Boolean) ?? [];

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">
              Integrare 999.md
            </h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${m.cls}`}>
              {m.label}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{m.text}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-ink-faint">Importate de pe 999.md:</dt>
              <dd className="font-semibold tabular-nums">{fromNnn}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-ink-faint">Publicate de pe site:</dt>
              <dd className="font-semibold tabular-nums">{fromSite}</dd>
            </div>
            {lastRun && (
              <div className="flex gap-1.5">
                <dt className="text-ink-faint">Ultimul import:</dt>
                <dd className={`font-semibold ${lastRun.ok ? "" : "text-accent"}`}>
                  {new Date(lastRun.startedAt).toLocaleString("ro-RO")}
                  {" · "}
                  {lastRun.ok ? lastRun.summary : lastRun.error ?? "eroare"}
                  <span className="font-normal text-ink-faint"> ({lastRun.trigger})</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <form action={action} className="shrink-0">
          <button
            type="submit"
            disabled={pending || mode === "off"}
            className="btn-dark h-11 px-5 text-[13px] disabled:opacity-50"
            title={mode === "off" ? "Setează NNN_API_KEY" : "Citește anunțurile firmei de pe 999.md"}
          >
            {pending ? "Se importă…" : "Importă din 999.md acum"}
          </button>
        </form>
      </div>

      {report && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            report.ok ? "bg-green-50 text-green-800" : "bg-accent-soft text-accent-deep"
          }`}
        >
          {report.ok
            ? `Import reușit: ${report.created} noi · ${report.updated} actualizate · ${report.archived} arhivate · ${report.unchanged} neschimbate · ${report.skipped} sărite`
            : `Eroare: ${report.error}`}
        </div>
      )}

      {warnings.length > 0 && (
        <details className="mt-3 text-xs text-amber-800">
          <summary className="cursor-pointer font-semibold">
            {warnings.length} avertismente la ultimul import
          </summary>
          <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Importul rulează automat o dată pe zi (cron Vercel) și la butonul de mai
        sus. Pentru anunțurile născute pe 999.md, 999.md rămâne sursa de adevăr: preț,
        specificații, descriere și poze se reîmprospătează de acolo; câmpurile
        doar-de-site (preț vechi, prima rată, rata lunară, promovată, status)
        nu se ating. Anunțurile care dispar sau expiră pe 999.md se arhivează
        singure aici. Mașinile adăugate pe site se publică pe 999.md la salvare
        și se ascund acolo automat când le marchezi vândute sau rezervate.
      </p>
    </section>
  );
}
