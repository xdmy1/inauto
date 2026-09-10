import { getTranslations } from "next-intl/server";
import { site, waHref } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

export async function FloatingWhatsApp() {
  const t = await getTranslations("common");

  return (
    <div className="group fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      {/* chat bubble — desktop hover */}
      <div
        className="btn-wa pointer-events-none absolute bottom-1/2 right-full mr-3.5 hidden h-auto w-max translate-x-2 translate-y-1/2 rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:flex"
        role="tooltip"
      >
        {t("waBubble")}
      </div>

      <a
        href={waHref(site.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp — ${t("waBubble")}`}
        className="btn-wa flex h-14 w-14 items-center justify-center rounded-full text-white"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
