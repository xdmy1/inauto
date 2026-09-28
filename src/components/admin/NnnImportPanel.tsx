"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { importNnnAction } from "@/app/(admin)/admin/actions";
import type { ImportReport } from "@/lib/nnn/import";
import type { NnnMode } from "@/lib/nnn/client";

const MODE_TEXT: Record<NnnMode, string | null> = {
  live: null,
  "read-only":
    "Anunțurile de pe 999.md se aduc pe site, dar mașinile adăugate aici NU se publică pe 999.md (NNN_DRY_RUN=1).",
  off: "Legătura cu 999.md nu e configurată: lipsește cheia API (NNN_API_KEY).",
};

/** "2 noi · 4 actualizate · 0 arhivate · …" → only the parts that are not zero */
function plainSummary(r: { created: number; updated: number; archived: number }) {
  const parts = [
    r.created && `${r.created} ${r.created === 1 ? "mașină nouă" : "mașini noi"}`,
    r.updated && `${r.updated} ${r.updated === 1 ? "actualizată" : "actualizate"}`,
    r.archived && `${r.archived} ${r.archived === 1 ? "scoasă" : "scoase"} de pe site (nu mai sunt pe 999)`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "nimic nou";
}

function parseSummary(s: string | null) {
  const n = (label: string) => Number(s?.match(new RegExp(`(\\d+) ${label}`))?.[1] ?? 0);
  return { created: n("noi"), updated: n("actualizate"), archived: n("arhivate") };
}

export function NnnImportPanel({
  mode,
  lastRun,
}: {
  mode: NnnMode;
  lastRun: {
    /** "azi la 09:50" — formatted on the server */
    when: string;
    running: boolean;
    ok: boolean;
    trigger: string;
    summary: string | null;
    error: string | null;
    details: string | null;
  } | null;
}) {
  const [report, action, pending] = useActionState<ImportReport | undefined>(
    importNnnAction,
    undefined
  );
  const router = useRouter();
  // a finished import changes the list below — reload it
  useEffect(() => {
    if (report?.ok) router.refresh();
  }, [report, router]);

  const warnings = report?.warnings ?? lastRun?.details?.split("\n").filter(Boolean) ?? [];
  const running = !!lastRun?.running;
  const note = MODE_TEXT[mode];

  let line: React.ReactNode;
  if (report) {
    line = report.ok ? (
      <>Gata: {plainSummary(report)}.</>
    ) : (
      <span className="text-accent-deep">Nu a mers: {report.error}</span>
    );
  } else if (running) {
    line = <>Se verifică acum (pornit {lastRun!.when})…</>;
  } else if (lastRun) {
    line = lastRun.ok ? (
      <>
        Ultima verificare: {lastRun.when} — {plainSummary(parseSummary(lastRun.summary))}.
      </>
    ) : (
      <span className="text-accent-deep">
        Ultima verificare ({lastRun.when}) a eșuat: {lastRun.error ?? "eroare"}
      </span>
    );
  } else {
    line = <>Nicio verificare încă.</>;
  }

  return (
    <section className="rounded-2xl border border-line bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-bold">Legătura cu 999.md</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{line}</p>
          {note && <p className="mt-1 text-sm font-medium text-accent-deep">{note}</p>}
        </div>
        <form action={action} className="w-full sm:w-auto sm:shrink-0">
          <button
            type="submit"
            disabled={pending || mode === "off" || running}
            className="btn-dark h-11 w-full px-5 text-[13px] disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Se verifică… (până la un minut)" : "Verifică 999.md acum"}
          </button>
        </form>
      </div>

      <details className="group mt-3 text-[13px] text-ink-soft">
        <summary className="cursor-pointer select-none font-semibold text-ink-soft hover:text-ink">
          Cum funcționează
          {warnings.length > 0 && ` · ${warnings.length} observații la ultima verificare`}
        </summary>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 leading-relaxed">
          <li>
            Site-ul verifică singur 999.md în fiecare dimineață și când deschizi panoul (dacă au trecut
            peste 6 ore). Butonul de mai sus verifică imediat.
          </li>
          <li>
            Pentru mașinile postate pe 999.md, 999.md decide: preț, poze, descriere și date se iau de
            acolo. Prețul vechi, rata, „promovată” și statusul le setezi aici și nu se ating.
          </li>
          <li>Un anunț șters sau expirat pe 999.md dispare singur și de pe site (trece la „Arhivat”).</li>
          <li>
            Mașinile adăugate aici se publică și pe 999.md la salvare; „Vândut” sau „Rezervat” le ascunde
            și acolo.
          </li>
        </ul>
        {warnings.length > 0 && (
          <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto rounded-lg bg-paper py-2 pl-8 pr-3 text-xs">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
