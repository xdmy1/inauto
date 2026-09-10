/* Seed: admin user + demo inventory using the real INAUTO.MD photos
   (downloaded into research/photos). Run: npm run db:seed */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const prisma = new PrismaClient();
const UPLOADS = path.join(process.cwd(), "uploads");
const PHOTOS = path.join(process.cwd(), "research", "photos");

async function importPhoto(carId: string, file: string) {
  const src = path.join(PHOTOS, file);
  const buf = await fs.readFile(src);
  const dir = path.join(UPLOADS, "cars", carId);
  await fs.mkdir(dir, { recursive: true });
  const name = crypto.randomBytes(8).toString("hex");

  const img = sharp(buf).rotate();
  const lg = await img
    .clone()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(dir, `${name}-lg.webp`), lg.data);
  await img
    .clone()
    .resize({ width: 640, height: 480, fit: "cover", position: "attention" })
    .webp({ quality: 75 })
    .toFile(path.join(dir, `${name}-sm.webp`));

  return {
    path: `cars/${carId}/${name}`,
    width: lg.info.width,
    height: lg.info.height,
  };
}

type DemoCar = {
  photo: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice?: number;
  downPayment?: number;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain?: string;
  mileage: number;
  engineCc?: number;
  powerHp?: number;
  color?: string;
  featured?: boolean;
  status?: string;
};

const demoCars: DemoCar[] = [
  { photo: "07a33a07c91b25ff2b5b946d978fb66ffd602f21.jpg", brand: "BMW", model: "X3 xDrive20d", year: 2018, price: 30499, oldPrice: 35999, downPayment: 3000, body: "suv", fuel: "diesel", transmission: "automatic", drivetrain: "awd", mileage: 77000, engineCc: 1995, powerHp: 190, color: "Argintiu", featured: true },
  { photo: "295468d056650715e6500567e77bf1adaec6e369.jpg", brand: "Toyota", model: "RAV4 Hybrid", year: 2019, price: 24499, downPayment: 2000, body: "suv", fuel: "hybrid", transmission: "cvt", drivetrain: "awd", mileage: 88000, engineCc: 2487, powerHp: 218, color: "Gri", featured: true },
  { photo: "5df5e9fb3b7356a717c2bcb28a649c78f02b16fb.jpg", brand: "Ford", model: "Fusion Titanium Plug-In", year: 2019, price: 17999, downPayment: 500, body: "sedan", fuel: "phev", transmission: "cvt", drivetrain: "fwd", mileage: 45000, engineCc: 1999, powerHp: 188, color: "Alb", featured: true },
  { photo: "6eea28cddc0be8963ed83e5757d174c4520255b4.jpg", brand: "Audi", model: "A4 B9", year: 2017, price: 18999, downPayment: 1500, body: "sedan", fuel: "petrol", transmission: "robotic", drivetrain: "fwd", mileage: 98000, engineCc: 1984, powerHp: 190, color: "Alb", featured: true },
  { photo: "05c0d0d3bbe5c94ae44730ae1c5519744d6de679.jpg", brand: "Opel", model: "Astra K Sports Tourer", year: 2017, price: 8999, downPayment: 300, body: "wagon", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 148000, engineCc: 1598, powerHp: 110, color: "Argintiu" },
  { photo: "2c167cff3fc016420f160c56570de583742cf18a.jpg", brand: "Ford", model: "EcoSport", year: 2016, price: 8499, downPayment: 200, body: "suv", fuel: "petrol", transmission: "manual", drivetrain: "fwd", mileage: 109000, engineCc: 1498, powerHp: 112, color: "Negru" },
  { photo: "4c5d58eb79adaa7839298a8642f3fd89216d3b5c.jpg", brand: "Ford", model: "Fiesta", year: 2016, price: 7199, downPayment: 100, body: "hatchback", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 113000, engineCc: 1499, powerHp: 95, color: "Albastru" },
  { photo: "5725d896ced1826f5f52e3f23a72b00a017bd417.jpg", brand: "Opel", model: "Meriva B", year: 2015, price: 7299, downPayment: 100, body: "minivan", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 175000, engineCc: 1598, powerHp: 110, color: "Negru" },
  { photo: "7debc4796949667ef86a7003b4ba77f5fe0731a3.jpg", brand: "Ford", model: "Focus Titanium", year: 2015, price: 7699, downPayment: 100, body: "hatchback", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 149000, engineCc: 1560, powerHp: 120, color: "Albastru" },
  { photo: "9e71651dda18f517bbcf16437cf4d22020aca319.jpg", brand: "Renault", model: "Scenic XMOD", year: 2015, price: 8299, downPayment: 200, body: "minivan", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 152000, engineCc: 1461, powerHp: 110, color: "Argintiu" },
  { photo: "b3eeccc89e03c21a251a38cfaa2338f1c2a94b4b.jpg", brand: "Audi", model: "A4 Allroad", year: 2015, price: 14999, downPayment: 1000, body: "wagon", fuel: "petrol", transmission: "robotic", drivetrain: "awd", mileage: 173000, engineCc: 1984, powerHp: 220, color: "Argintiu", status: "RESERVED" },
  { photo: "d70990d7517fa3c5ee2d8346528ea337e5960d6b.jpeg", brand: "Ford", model: "Fusion SE Hybrid", year: 2015, price: 11499, oldPrice: 12499, downPayment: 300, body: "sedan", fuel: "hybrid", transmission: "cvt", drivetrain: "fwd", mileage: 164000, engineCc: 1999, powerHp: 188, color: "Alb", status: "SOLD" },
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "office@inauto.md").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "schimba-parola";
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: "Admin", passwordHash: await bcrypt.hash(password, 10) },
    update: {},
  });
  console.log(`Admin: ${email} / ${password}`);

  if (process.env.SEED_RESET === "1") {
    await prisma.car.deleteMany();
    await fs.rm(path.join(UPLOADS, "cars"), { recursive: true, force: true });
    console.log("Reset: cars + uploads cleared");
  }

  const existing = await prisma.car.count();
  if (existing > 0) {
    console.log(`Skip demo cars — ${existing} cars already in DB (SEED_RESET=1 to reseed)`);
    return;
  }

  for (const c of demoCars) {
    const { photo, status, ...data } = c;
    const car = await prisma.car.create({
      data: {
        ...data,
        slug: slugify(`${c.brand}-${c.model}-${c.year}`),
        status: status ?? "PUBLISHED",
        location: "mun. Chișinău, str. Cucorilor 14",
        seats: 5,
        descriptionRo: `${c.brand} ${c.model}, ${c.year}. Stare tehnică foarte bună, kilometraj real verificat, istoric transparent. Adusă recent, un singur proprietar. Posibilitate de finanțare cu prima rată de la ${c.downPayment ?? 100} €. Test drive la parcarea noastră din str. Cucorilor 14, Chișinău.`,
        descriptionRu: `${c.brand} ${c.model}, ${c.year} г. Отличное техническое состояние, проверенный реальный пробег, прозрачная история. Недавно пригнан, один владелец. Возможно финансирование с первым взносом от ${c.downPayment ?? 100} €. Тест-драйв на нашей площадке: ул. Кукорилор 14, Кишинёв.`,
      },
    });
    const img = await importPhoto(car.id, photo);
    await prisma.carImage.create({
      data: { carId: car.id, ...img, order: 0 },
    });
    console.log(`+ ${c.brand} ${c.model} ${c.year}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
