"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import {
  BODIES,
  DRIVETRAINS,
  FUELS,
  STATUSES,
  TRANSMISSIONS,
  uniqueCarSlug,
} from "@/lib/cars";
import { deleteCarImageFiles, saveCarImage } from "@/lib/uploads";
import { republishCarOn999, syncCarTo999, type SyncReport } from "@/lib/nnn/sync";

// ——— auth ———

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email sau parolă incorectă" };
  }
  const token = await createSessionToken({ sub: user.id, email: user.email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ——— cars ———

const carSchema = z.object({
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(80),
  year: z.coerce.number().int().min(1970).max(2030),
  price: z.coerce.number().int().min(1),
  oldPrice: z.coerce.number().int().min(1).optional(),
  downPayment: z.coerce.number().int().min(0).optional(),
  monthlyRate: z.coerce.number().int().min(0).optional(),
  body: z.enum(BODIES),
  fuel: z.enum(FUELS),
  transmission: z.enum(TRANSMISSIONS),
  drivetrain: z.enum(DRIVETRAINS).optional(),
  mileage: z.coerce.number().int().min(0),
  engineCc: z.coerce.number().int().min(0).optional(),
  powerHp: z.coerce.number().int().min(0).optional(),
  color: z.string().max(40).optional(),
  seats: z.coerce.number().int().min(1).max(12).optional(),
  vin: z.string().max(30).optional(),
  location: z.string().max(120).optional(),
  descriptionRo: z.string().max(8000).optional(),
  descriptionRu: z.string().max(8000).optional(),
  status: z.enum(STATUSES),
  featured: z.boolean(),
});

function parseCarForm(formData: FormData) {
  const opt = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? undefined : v;
  };
  return carSchema.safeParse({
    brand: opt("brand"),
    model: opt("model"),
    year: opt("year"),
    price: opt("price"),
    oldPrice: opt("oldPrice"),
    downPayment: opt("downPayment"),
    monthlyRate: opt("monthlyRate"),
    body: opt("body"),
    fuel: opt("fuel"),
    transmission: opt("transmission"),
    drivetrain: opt("drivetrain"),
    mileage: opt("mileage"),
    engineCc: opt("engineCc"),
    powerHp: opt("powerHp"),
    color: opt("color"),
    seats: opt("seats"),
    vin: opt("vin"),
    location: opt("location"),
    descriptionRo: opt("descriptionRo"),
    descriptionRu: opt("descriptionRu"),
    status: opt("status") ?? "DRAFT",
    featured: formData.get("featured") === "on",
  });
}

export type SaveCarState = {
  error?: string;
  ok?: boolean;
  nnn?: SyncReport;
};

async function processImages(carId: string, formData: FormData) {
  // deletions
  const toDelete = formData.getAll("deleteImage").map(String).filter(Boolean);
  if (toDelete.length) {
    const imgs = await prisma.carImage.findMany({
      where: { id: { in: toDelete }, carId },
    });
    await prisma.carImage.deleteMany({
      where: { id: { in: toDelete }, carId },
    });
    for (const img of imgs) await deleteCarImageFiles(img.path);
  }

  // reorder
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("order:")) {
      const id = key.slice("order:".length);
      const order = Number(value);
      if (Number.isFinite(order)) {
        await prisma.carImage
          .update({ where: { id }, data: { order } })
          .catch(() => {});
      }
    }
  }

  // new uploads
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length) {
    const maxOrder = await prisma.carImage.aggregate({
      where: { carId },
      _max: { order: true },
    });
    let order = (maxOrder._max.order ?? -1) + 1;
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) continue;
      const saved = await saveCarImage(carId, file);
      await prisma.carImage.create({
        data: {
          carId,
          path: saved.basePath,
          width: saved.width,
          height: saved.height,
          order: order++,
        },
      });
    }
  }
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

export async function saveCarAction(
  _prev: SaveCarState | undefined,
  formData: FormData
): Promise<SaveCarState> {
  const parsed = parseCarForm(formData);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `Câmp invalid: ${issue.path.join(".")} — ${issue.message}` };
  }
  const data = parsed.data;
  const carId = String(formData.get("carId") ?? "");

  let id = carId;
  if (carId) {
    await prisma.car.update({ where: { id: carId }, data });
  } else {
    const slug = await uniqueCarSlug(data.brand, data.model, data.year);
    const created = await prisma.car.create({ data: { ...data, slug } });
    id = created.id;
  }

  await processImages(id, formData);

  let nnn: SyncReport | undefined;
  if (formData.get("syncNnn") === "on" && data.status === "PUBLISHED") {
    nnn = await syncCarTo999(id);
  }

  revalidateSite();
  if (!carId) redirect(`/admin/cars/${id}?created=1`);
  return { ok: true, nnn };
}

export async function deleteCarAction(formData: FormData) {
  const id = String(formData.get("carId") ?? "");
  if (!id) return;
  const imgs = await prisma.carImage.findMany({ where: { carId: id } });
  await prisma.car.delete({ where: { id } });
  for (const img of imgs) await deleteCarImageFiles(img.path);
  revalidateSite();
  redirect("/admin");
}

export async function setStatusAction(formData: FormData) {
  const id = String(formData.get("carId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) return;
  await prisma.car.update({ where: { id }, data: { status } });
  revalidateSite();
}

export async function syncNnnAction(
  _prev: SyncReport | undefined,
  formData: FormData
): Promise<SyncReport> {
  const id = String(formData.get("carId") ?? "");
  const report = await syncCarTo999(id);
  revalidatePath(`/admin/cars/${id}`);
  return report;
}

export async function republishNnnAction(
  _prev: SyncReport | undefined,
  formData: FormData
): Promise<SyncReport> {
  const id = String(formData.get("carId") ?? "");
  const report = await republishCarOn999(id);
  revalidatePath(`/admin/cars/${id}`);
  return report;
}
