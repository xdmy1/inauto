# inauto.md — parc auto Chișinău

Redesign complet: Next.js 16 (App Router) + Tailwind v4 + Prisma. Bilingv RO/RU,
SEO tehnic în cod, panou de administrare și integrare 999.md.

## Pornire rapidă

```bash
npm install
npx prisma db push        # creează baza de date (SQLite în dev)
npm run db:seed           # admin + mașini demo cu poze placeholder
npm run dev               # http://localhost:3000
```

**Admin:** `http://localhost:3000/admin` — email `office@inauto.md`, parola
`schimba-parola` (setate din `.env` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`; rulează
seed-ul din nou după schimbare, sau schimbă direct în DB).

## Structură

| Zonă | Unde |
|---|---|
| Site public (RO la `/`, RU la `/ru`) | `src/app/(site)/[locale]/` |
| Panou admin (login, listă, formular mașină) | `src/app/(admin)/admin/` |
| Integrare 999.md (client API, mapare, export, import) | `src/lib/nnn/` |
| Cron import 999.md | `src/app/api/nnn/import/route.ts` + `vercel.json` |
| Pagini pe marcă (SEO) | `src/app/(site)/[locale]/marca/[brand]/` |
| Poze încărcate (webp pre-redimensionat: `-sm` 640px, `-lg` 1600px) | `uploads/`, servite prin `/uploads/...` |
| Traduceri | `src/messages/ro.json`, `ru.json` |
| Date firmă (telefoane, adresă, program) | `src/lib/site.ts` |

## SEO (ce e deja în cod)

- Metadata per pagină RO/RU + `hreflang` alternates + canonical
- JSON-LD: `AutoDealer` (global) + `Car`/`Offer` pe pagina fiecărei mașini
- `sitemap.xml` generat automat (include toate mașinile publicate, ambele limbi)
- `robots.txt` (blochează `/admin`, `/api`)
- Pagini statice pre-generate (acasă, despre, contacte) — regenerare automată la
  fiecare salvare din admin; poze webp cu cache imutabil
- La lansare: setează `NEXT_PUBLIC_SITE_URL="https://inauto.md"` în `.env`,
  verifică domeniul în Google Search Console și trimite sitemap-ul

## Integrarea 999.md — în ambele sensuri

**Site → 999.md.** Salvezi mașina în admin cu bifa „Publică / actualizează pe
999.md" (sau butonul din panoul lateral) → se urcă pozele, se construiește
anunțul cu titlu + descriere RO/RU, dotările și toate caracteristicile →
anunțul se creează sau se actualizează pe contul 999.md al firmei. Când marchezi
mașina **vândută / rezervată / arhivată**, anunțul se **ascunde automat** pe
999.md (și reapare când o pui din nou „Publicat"). „Republică" ridică anunțul în
listă; „Ascunde / Arată" controlează vizibilitatea manual.

**999.md → site.** Anunțurile din Autoturisme și Microbuze/furgonete se importă
ca mașini publicate. Pozele nu se copiază — site-ul le afișează direct de pe
CDN-ul 999.md (i.simpalsmedia.com). API-ul limitează ritmul (~2 cereri/s), așa
că un anunț e recitit doar când 999.md arată o schimbare (data republicării
sau prețul), iar o rulare citește cât încape în 4 minute și lasă restul pentru
următoarea. Rulează:
- automat, **o dată pe zi** (cron Vercel din `vercel.json`, ruta
  `/api/nnn/import`, protejată cu `CRON_SECRET`);
- automat, când deschizi panoul admin și ultimul import are peste 6 ore;
- manual, din butonul „Importă din 999.md acum" (panoul de sus din admin).

Regula de conflict: **cine a născut anunțul e sursa de adevăr.** Mașinile
importate de pe 999.md își reiau de acolo prețul, specificațiile, descrierea și
pozele la fiecare import; câmpurile doar-de-site (preț vechi, prima rată, rata
lunară, promovată, status, adresă) nu se ating. Mașinile create pe site nu sunt
suprascrise de import. Anunțurile care dispar sau expiră pe 999.md își
**arhivează** mașina automat; când redevin publice, mașina revine.

Activare (făcută pe 22.09.2026 — cheia e în Vercel):
1. Cheia API se generează din contul 999.md al firmei (Setări → API / „Generează
   un cod unic"; documentația: https://partners-api.999.md/api/documentation).
2. În `.env` / Vercel: `NNN_API_KEY="cheia"` și `NNN_DRY_RUN="0"` (importul merge
   și cu `NNN_DRY_RUN=1` — doar postarea e simulată). Pentru cron: `CRON_SECRET`.
3. Fără cheie totul rulează în **mod simulare** (vezi badge-ul din admin).

Exportul (site → 999.md) nu a fost încă exersat cu o postare reală — prima
publicare din admin trebuie urmărită în panoul 999.

Maparea câmpurilor se face dinamic după schema categoriei Transport →
Autoturisme → Vând; orice câmp care nu poate fi mapat apare ca avertisment în
admin (nu blochează publicarea). Logica pură de mapare e în
`src/lib/nnn/mapping.ts` + `import.ts` (`mapAdvert`), testabilă fără rețea.

## Pagini SEO pe marcă

`/marca/bmw`, `/ru/marca/bmw` … — „BMW de vânzare în Chișinău", generate din
mărcile din parcare (titlu, descriere, `ItemList` JSON-LD, sitemap, footer).

## Bază de date — alegerea pentru producție

Dev-ul rulează pe **SQLite** (zero configurare). Pentru producție, în funcție de
hosting:

- **VPS propriu (recomandat aici)** — un singur server, câteva sute de anunțuri,
  trafic de dealership: **rămâi pe SQLite** (fișier + backup zilnic prin cron)
  sau treci pe **PostgreSQL local** dacă vrei confort la scalare. Pozele stau pe
  disc în `uploads/` — exact cum e scris codul acum. Cel mai ieftin și rapid.
- **Vercel / serverless** — SQLite și discul local nu funcționează: treci pe
  **PostgreSQL gestionat (Neon sau Supabase)** — în `prisma/schema.prisma`
  schimbi `provider = "postgresql"`, setezi `DATABASE_URL`, `prisma db push` —
  și muți pozele pe un storage extern (Supabase Storage / S / R2; de adaptat
  `src/lib/uploads.ts`, un singur fișier).

Concluzie scurtă: **VPS + SQLite/Postgres local** e alegerea corectă pentru acest
proiect — site-ul e majoritar static, baza e mică, iar pozele pe disc simplifică
tot. Neon/Supabase doar dacă vrei neapărat Vercel.

## Deploy pe VPS (schiță)

```bash
npm run build
npm start                  # sau pm2 start "npm start" --name inauto
# nginx reverse-proxy către :3000 + certbot pentru HTTPS
```

`.env` în producție: `AUTH_SECRET` nou (lung, aleator), `NEXT_PUBLIC_SITE_URL`,
`NNN_API_KEY`, `NNN_DRY_RUN=0`, `CRON_SECRET`, parolă admin nouă.
