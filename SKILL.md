---
name: damian-design
description: Damian's personal design and delivery rules for anything a person will see in a browser — "3D" gradient buttons, custom (never native) dropdowns and form controls, icon choices, a custom 404 on every site, and a 20-point pre-launch checklist. Use this skill every time you write, edit, style, or review frontend/UI code - landing pages, Next.js pages and components, forms, buttons, navigation, footers, icons, error pages, responsive fixes. Load it even when the user only says "fă un site", "adaugă o secțiune", "un formular", "landing", "fix mobile", or asks for a component and never mentions design. Damian expects these rules applied by default, whether he writes in Romanian, Russian or English.
---

# damian-design

Damian is a self-taught front-end developer (Next.js + Supabase) who builds custom-coded sites for clients under landings.md and his own product, DropPack. These are his standing rules for how UI should look and what "done" means. They exist because the default output of AI coding tools has a recognisable, generic look — thin-stroke icon badges, native selects, flat buttons, lorem ipsum, a missing 404 — and his clients are paying precisely to not get that.

Apply these rules without being asked. If one of them conflicts with an explicit instruction in the current task, the task wins, but say so in one line.

Reference images live in `assets/`. Read the relevant one before styling that element — they communicate more than the text below.

## Glossary — Damian's vocabulary

- **"butoane 3D" / "3D buttons"** — not skeuomorphic, not extruded. It means: a vertical gradient from a lighter tint (top) to a darker shade (bottom) of the button colour, plus a thin white inner highlight along the top edge. See `assets/button-3d-reference.png`.

## 1. Buttons

Primary CTAs are "3D" in Damian's sense (glossary above, `assets/button-3d-reference.png`):

- Vertical gradient, lighter at the top, darker at the bottom, both derived from the brand colour. The reference is blue, but the technique applies to whatever the project's accent is.
- The thin white inner highlight on the top edge is what sells the effect. Underneath, a soft drop shadow in the button's own hue at low opacity, so the button sits above the page.
- Generous radius (~12px on a 44–52px tall button), white medium-weight label, comfortable horizontal padding.
- The reference label ends with a → arrow. That's a natural fit for a CTA that leads somewhere (sign up, next step); use judgement rather than putting arrows on every button.
- Hover: nudge the gradient slightly darker. Active: reduce the shadow so it feels pressed. Keep transitions short (~150ms).

Starting point, tune to the brand:

```css
.btn-3d {
  background: linear-gradient(180deg, #4d7cf6 0%, #2f62e6 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35),
              0 4px 12px rgba(47, 98, 230, 0.35);
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
}
```

Tailwind equivalent: `bg-gradient-to-b from-[#4d7cf6] to-[#2f62e6] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_4px_12px_rgba(47,98,230,.35)] rounded-xl text-white font-medium`.

## 2. Forms and dropdowns

Native form controls carry the operating system's look, which breaks the design the moment they appear. So:

- Never render a bare `select`. Every dropdown is a custom component styled like the rest of the UI, and it opens downward with a pleasant animation — fade plus a small slide or scale, ~150–200ms ease-out, with a matching close.
- Headless primitives (Radix Select/Popover, Headless UI Listbox, or a hand-rolled component) are fine as the behaviour layer. The rule is about the native look, not about avoiding libraries. Whatever you use, keep keyboard navigation, focus management, Escape and outside-click to close, and proper ARIA roles.
- Same spirit for the other controls browsers draw natively — date inputs, file inputs, checkboxes, radios: style them to match the design system.
- Every form gives feedback: an explicit success state after submit, and clear, specific error messages (per field when possible). A form that silently does nothing, or only logs to the console, is not finished.

## 3. Icons

`assets/icons-bad-example.png` shows what Damian never wants to see: uniform thin-stroke glyphs (Lucide, Feather, Heroicons and anything that looks like them — 24px grid, 1.5–2px stroke, rounded caps), typically dropped into a pale tinted rounded square on a feature card. That combination is the "made by AI" tell.

Two acceptable directions instead:

1. **Thin but refined** — a distinctive light-weight set with real character, not the default stroke look. If the project already has a set, use it.
2. **Illustrative** — small spot illustrations rather than glyphs: grey fills, an accent in the brand colour, a thin dark outline, a hint of depth. See `assets/icons-good-example.png`. There, each icon sits in a white rounded square with a soft shadow, nested in a light-grey rounded square — a container pattern worth reusing.

Rules of thumb:

- Don't fall back to Lucide/Heroicons because they're one import away. If the project has no icon source yet, ask Damian which set to use, or propose 2–3 concrete options with a rendered sample and let him pick. Custom SVGs drawn for the project are always acceptable.
- Whether the badge + icon + title + text card pattern fits is a per-project judgement; the icon rule applies regardless.
- Icons should look like they belong to the design — consistent weight, style and size across the whole site.

## 4. Every site has a custom 404

Ship a designed 404 page on every project, in the site's own visual language (same header and footer, typography, colours), with a clear way back — at least a link to the homepage, ideally the main navigation too. In Next.js: `app/not-found.tsx` (App Router) or `pages/404.tsx` (Pages Router). A default framework 404 is a bug.

## 5. Pre-launch checklist

Run through this before calling any site or page "done", and report what you checked. Every item is something clients notice.

Must not exist:

- Horizontal scroll at any viewport width. Find the overflowing element and fix it; `overflow-x: hidden` on the body hides the symptom, not the cause.
- Placeholder text: no lorem ipsum, no "Your text here", no invented stats.
- Navigation items without a real destination.
- Layout overflow on mobile (text or images spilling out of their containers).

Must exist:

- A working mobile menu.
- Favicon (App Router: `app/icon.png` or `icon.svg`, plus an apple-touch-icon).
- A correct, specific page title on every page.
- A meta description on every page (`metadata` export or `generateMetadata`).
- The custom 404 from section 4.
- A copyright year that updates itself: `new Date().getFullYear()`.
- Success and error messages on every form.
- Compressed images: `next/image` with sensible `sizes`, modern formats, no multi-megabyte hero images.

Must be clickable:

- Logo → homepage.
- Phone numbers → `tel:` links in international format (`+373…` for Moldovan numbers).
- Email addresses → `mailto:` links.

Must be verified:

- Every link works, footer included — no bare `#`, no dead routes.
- Every button does something.
- Mobile layout checked at roughly 360px and 390px widths, with comfortable touch targets.

## When in doubt

If one of Damian's terms is ambiguous for the task at hand, ask a one-line question rather than guessing — but don't ask about things this file already answers.
