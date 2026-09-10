"use client";

import { useActionState, useState } from "react";
import {
  saveCarAction,
  type SaveCarState,
} from "@/app/(admin)/admin/actions";
import {
  BODIES,
  DRIVETRAINS,
  FUELS,
  STATUSES,
  TRANSMISSIONS,
} from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { Select } from "@/components/ui/Select";

const BODY_RO: Record<string, string> = { sedan: "Sedan", hatchback: "Hatchback", wagon: "Universal", suv: "SUV / Crossover", coupe: "Coupe", cabrio: "Cabriolet", minivan: "Minivan", van: "Furgon", pickup: "Pickup" };
const FUEL_RO: Record<string, string> = { petrol: "Benzin\u0103", diesel: "Motorin\u0103", hybrid: "Hybrid", phev: "Plug-in Hybrid", electric: "Electric", gas: "Gaz / Benzin\u0103" };
const TRANS_RO: Record<string, string> = { automatic: "Automat\u0103", manual: "Mecanic\u0103", robotic: "Robotizat\u0103", cvt: "Variator (CVT)" };
const DRIVE_RO: Record<string, string> = { fwd: "Fa\u021b\u0103", rwd: "Spate", awd: "4x4" };

export type CarFormData = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice: number | null;
  downPayment: number | null;
  monthlyRate: number | null;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain: string | null;
  mileage: number;
  engineCc: number | null;
  powerHp: number | null;
  color: string | null;
  seats: number | null;
  vin: string | null;
  location: string | null;
  descriptionRo: string;
  descriptionRu: string;
  status: string;
  featured: boolean;
  images: { id: string; path: string; order: number }[];
} | null;

const POPULAR_BRANDS = [
  "Audi", "BMW", "Chevrolet", "Citroen", "Dacia", "Fiat", "Ford", "Honda",
  "Hyundai", "Infiniti", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz",
  "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Skoda",
  "Subaru", "Suzuki", "Toyota", "Volkswagen", "Volvo",
];

const inputCls =
  "h-10 w-full rounded-lg border border-line bg-paper px-2.5 text-sm outline-none focus:border-ink";
const labelCls =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function CarForm({ car }: { car: CarFormData }) {
  const [state, action, pending] = useActionState<
    SaveCarState | undefined,
    FormData
  >(saveCarAction, undefined);
  const [body, setBody] = useState(car?.body ?? "sedan");
  const [fuel, setFuel] = useState(car?.fuel ?? "petrol");
  const [transmission, setTransmission] = useState(car?.transmission ?? "automatic");
  const [drivetrain, setDrivetrain] = useState(car?.drivetrain ?? "");
  const [status, setStatus] = useState(car?.status ?? "PUBLISHED");

  return (
    <form action={action} className="space-y-8">
      {car && <input type="hidden" name="carId" value={car.id} />}

      {/* Identity */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Mașina
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Marca *">
            <input
              name="brand"
              required
              list="brands"
              defaultValue={car?.brand}
              className={inputCls}
            />
            <datalist id="brands">
              {POPULAR_BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Modelul *">
            <input name="model" required defaultValue={car?.model} className={inputCls} />
          </Field>
          <Field label="Anul *">
            <input
              type="number"
              name="year"
              required
              min={1970}
              max={2030}
              defaultValue={car?.year ?? new Date().getFullYear() - 5}
              className={inputCls}
            />
          </Field>
          <Field label="VIN">
            <input name="vin" defaultValue={car?.vin ?? ""} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Price */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Preț & finanțare
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Preț (€) *">
            <input type="number" name="price" required min={1} defaultValue={car?.price} className={inputCls} />
          </Field>
          <Field label="Preț vechi (€)">
            <input type="number" name="oldPrice" min={1} defaultValue={car?.oldPrice ?? ""} className={inputCls} />
          </Field>
          <Field label="Prima rată (€)">
            <input type="number" name="downPayment" min={0} defaultValue={car?.downPayment ?? ""} className={inputCls} />
          </Field>
          <Field label="Rată lunară (€)">
            <input type="number" name="monthlyRate" min={0} defaultValue={car?.monthlyRate ?? ""} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Tech specs */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Caracteristici
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Caroserie *">
            <Select name="body" value={body} onChange={setBody} options={BODIES.map((b) => ({ value: b, label: BODY_RO[b] ?? b }))} />
          </Field>
          <Field label="Combustibil *">
            <Select name="fuel" value={fuel} onChange={setFuel} options={FUELS.map((f) => ({ value: f, label: FUEL_RO[f] ?? f }))} />
          </Field>
          <Field label="Cutia *">
            <Select name="transmission" value={transmission} onChange={setTransmission} options={TRANSMISSIONS.map((t) => ({ value: t, label: TRANS_RO[t] ?? t }))} />
          </Field>
          <Field label="Tracțiune">
            <Select name="drivetrain" value={drivetrain} onChange={setDrivetrain} options={DRIVETRAINS.map((d) => ({ value: d, label: DRIVE_RO[d] ?? d }))} />
          </Field>
          <Field label="Kilometraj *">
            <input type="number" name="mileage" required min={0} defaultValue={car?.mileage} className={inputCls} />
          </Field>
          <Field label="Motor (cm³)">
            <input type="number" name="engineCc" min={0} defaultValue={car?.engineCc ?? ""} className={inputCls} />
          </Field>
          <Field label="Putere (CP)">
            <input type="number" name="powerHp" min={0} defaultValue={car?.powerHp ?? ""} className={inputCls} />
          </Field>
          <Field label="Culoare">
            <input name="color" defaultValue={car?.color ?? ""} className={inputCls} />
          </Field>
          <Field label="Locuri">
            <input type="number" name="seats" min={1} max={12} defaultValue={car?.seats ?? ""} className={inputCls} />
          </Field>
          <Field label="Parcarea (adresa)" className="col-span-2 sm:col-span-3">
            <input name="location" defaultValue={car?.location ?? ""} placeholder="mun. Chișinău, str. Cucorilor 14" className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Descriptions */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Descriere
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field label="Română">
            <textarea
              name="descriptionRo"
              rows={7}
              defaultValue={car?.descriptionRo}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-sm outline-none focus:border-ink"
            />
          </Field>
          <Field label="Русский">
            <textarea
              name="descriptionRu"
              rows={7}
              defaultValue={car?.descriptionRu}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-sm outline-none focus:border-ink"
            />
          </Field>
        </div>
      </section>

      {/* Photos */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Fotografii
        </h2>
        {car && car.images.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {car.images.map((img) => (
              <div key={img.id} className="rounded-xl border border-line p-2">
                <img
                  src={imageUrl(img.path, "sm")}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <input
                    type="number"
                    name={`order:${img.id}`}
                    defaultValue={img.order}
                    min={0}
                    title="Ordinea"
                    className="h-8 w-14 rounded-md border border-line bg-paper px-1.5 text-xs"
                  />
                  <label className="flex cursor-pointer items-center gap-1 text-xs text-accent">
                    <input type="checkbox" name="deleteImage" value={img.id} />
                    șterge
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-paper hover:file:bg-black"
        />
        <p className="mt-2 text-xs text-ink-faint">
          JPG / PNG / WebP, max 15 MB per fotografie. Prima fotografie (ordinea 0) e cea principală.
        </p>
      </section>

      {/* Publishing */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
          Publicare
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <Field label="Status" className="w-44">
            <Select name="status" value={status} onChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          </Field>
          <label className="flex items-center gap-2 pt-4 text-sm font-medium">
            <input type="checkbox" name="featured" defaultChecked={car?.featured} />
            Promovată pe prima pagină
          </label>
          <label className="flex items-center gap-2 pt-4 text-sm font-medium">
            <input type="checkbox" name="syncNnn" defaultChecked />
            Publică / actualizează pe 999.md la salvare
          </label>
        </div>
      </section>

      {state?.error && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-deep">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Salvat ✓
          {state.nnn && (
            <span className="mt-1 block font-normal">
              999.md: {state.nnn.action}
              {state.nnn.advertId ? ` (anunț #${state.nnn.advertId})` : ""}
              {state.nnn.error ? ` — ${state.nnn.error}` : ""}
              {state.nnn.warnings.length > 0 && (
                <span className="mt-1 block text-amber-700">
                  {state.nnn.warnings.join(" · ")}
                </span>
              )}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary h-12 px-8 disabled:opacity-60"
        >
          {pending ? "Se salvează..." : car ? "Salvează modificările" : "Adaugă mașina"}
        </button>
      </div>
    </form>
  );
}
