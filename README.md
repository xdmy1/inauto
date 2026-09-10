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
| Integrare 999.md (client API + mapare) | `src/lib/nnn/` |
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

## Integrarea 999.md

Flux: salvezi mașina în admin cu bifa „Publică pe 999.md" (sau butonul din
panoul lateral) → se urcă pozele, se construiește anunțul cu titlu + descriere
în RO și RU și toate caracteristicile → anunțul se creează sau se actualizează
pe contul 999.md al firmei. Butonul „Republică" ridică anunțul în listă.

Activare:
1. Cere cheia API pentru contul firmei: info@999.md (Partners API —
   https://partners-api.999.md/api/documentation).
2. În `.env`: `NNN_API_KEY="cheia"` și `NNN_DRY_RUN="0"`.
3. Până atunci totul rulează în **mod simulare** (vezi badge-ul din admin).

Maparea câmpurilor se face dinamic după schema categoriei Transport →
Autoturisme → Vând; orice câmp care nu poate fi mapat apare ca avertisment în
admin (nu blochează publicarea).

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
`NNN_API_KEY`, `NNN_DRY_RUN=0`, parolă admin nouă.
