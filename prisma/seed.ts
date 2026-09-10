/* Seed: admin user + demo inventory with generated placeholder photos.
   Run: npm run db:seed */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const prisma = new PrismaClient();
const UPLOADS = path.join(process.cwd(), "uploads");

const CAR_SVG_BODY = `M40 290c0-36 36-63 99-81l99-27 108-81c27-18 54-27 90-27h126c45 0 81 9 117 36l90 63 135 27c54 18 90 45 90 72 0 18-18 27-36 27h-63a99 99 0 0 0-198 0H427a99 99 0 0 0-198 0h-81c-45 0-108-9-108-9Z`;

function placeholderSvg(w: number, h: number, hue: number, label: string) {
  const bg1 = `hsl(${hue} 18% 88%)`;
  const bg2 = `hsl(${hue} 22% 78%)`;
  const carColor = `hsl(${hue} 28% 38%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect y="${h - 140}" width="${w}" height="140" fill="hsl(${hue} 15% 62%)" opacity="0.35"/>
  <g transform="translate(${w / 2 - 500}, ${h / 2 - 220}) scale(1)">
    <path d="${CAR_SVG_BODY}" fill="${carColor}"/>
    <circle cx="328" cy="290" r="72" fill="${carColor}"/>
    <circle cx="328" cy="290" r="34" fill="${bg1}"/>
    <circle cx="946" cy="290" r="72" fill="${carColor}"/>
    <circle cx="946" cy="290" r="34" fill="${bg1}"/>
  </g>
  <text x="${w / 2}" y="${h - 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="hsl(${hue} 20% 30%)">${label}</text>
</svg>`;
}

async function makeImages(carId: string, hue: number, label: string, n = 3) {
  const dir = path.join(UPLOADS, "cars", carId);
  await fs.mkdir(dir, { recursive: true });
  const out: { path: string; order: number }[] = [];
  for (let i = 0; i < n; i++) {
    const name = crypto.randomBytes(8).toString("hex");
    const svg = Buffer.from(
      placeholderSvg(1600, 1200, (hue + i * 14) % 360, label)
    );
    await sharp(svg).webp({ quality: 80 }).toFile(path.join(dir, `${name}-lg.webp`));
    await sharp(svg)
      .resize(640, 480)
      .webp({ quality: 75 })
      .toFile(path.join(dir, `${name}-sm.webp`));
    out.push({ path: `cars/${carId}/${name}`, order: i });
  }
  return out;
}

const demoCars = [
  { brand: "BMW", model: "X3 xDrive20d", year: 2018, price: 30499, oldPrice: 35999, downPayment: 3000, body: "suv", fuel: "diesel", transmission: "automatic", drivetrain: "awd", mileage: 77000, engineCc: 1995, powerHp: 190, color: "Gri", featured: true, hue: 210 },
  { brand: "Ford", model: "Fusion SE Hybrid", year: 2019, price: 17999, downPayment: 500, body: "sedan", fuel: "phev", transmission: "automatic", drivetrain: "fwd", mileage: 45000, engineCc: 1999, powerHp: 188, color: "Alb", featured: true, hue: 0 },
  { brand: "Toyota", model: "RAV4", year: 2019, price: 24499, downPayment: 2000, body: "suv", fuel: "hybrid", transmission: "cvt", drivetrain: "awd", mileage: 88000, engineCc: 2494, powerHp: 218, color: "Negru", featured: true, hue: 120 },
  { brand: "Volkswagen", model: "Passat B8", year: 2017, price: 14299, downPayment: 500, body: "wagon", fuel: "diesel", transmission: "robotic", drivetrain: "fwd", mileage: 168000, engineCc: 1968, powerHp: 150, color: "Albastru", hue: 225 },
  { brand: "Dacia", model: "Duster", year: 2019, price: 12499, downPayment: 300, body: "suv", fuel: "petrol", transmission: "manual", drivetrain: "fwd", mileage: 96000, engineCc: 1332, powerHp: 130, color: "Portocaliu", hue: 25 },
  { brand: "Mercedes-Benz", model: "E 220 d", year: 2016, price: 21999, oldPrice: 23999, downPayment: 2000, body: "sedan", fuel: "diesel", transmission: "automatic", drivetrain: "rwd", mileage: 154000, engineCc: 1950, powerHp: 194, color: "Negru", hue: 260 },
  { brand: "Skoda", model: "Octavia", year: 2018, price: 13499, downPayment: 400, body: "wagon", fuel: "diesel", transmission: "robotic", drivetrain: "fwd", mileage: 142000, engineCc: 1968, powerHp: 150, color: "Gri", hue: 200 },
  { brand: "Hyundai", model: "Tucson", year: 2021, price: 23999, downPayment: 2500, body: "suv", fuel: "hybrid", transmission: "automatic", drivetrain: "awd", mileage: 61000, engineCc: 1598, powerHp: 230, color: "Alb", hue: 170 },
  { brand: "Renault", model: "Megane IV", year: 2017, price: 9999, downPayment: 200, body: "hatchback", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 158000, engineCc: 1461, powerHp: 110, color: "Roșu", hue: 5 },
  { brand: "Audi", model: "A4 B9", year: 2016, price: 16999, downPayment: 1000, body: "sedan", fuel: "diesel", transmission: "robotic", drivetrain: "awd", mileage: 173000, engineCc: 1968, powerHp: 190, color: "Gri", hue: 220 },
  { brand: "Ford", model: "Focus", year: 2014, price: 7699, downPayment: 100, body: "hatchback", fuel: "petrol", transmission: "manual", drivetrain: "fwd", mileage: 149000, engineCc: 1596, powerHp: 105, color: "Albastru", hue: 240 },
  { brand: "Opel", model: "Astra K", year: 2015, price: 7299, downPayment: 100, body: "hatchback", fuel: "diesel", transmission: "manual", drivetrain: "fwd", mileage: 175000, engineCc: 1598, powerHp: 110, color: "Negru", hue: 280 },
  { brand: "Kia", model: "Sportage", year: 2020, price: 19999, downPayment: 1500, body: "suv", fuel: "diesel", transmission: "automatic", drivetrain: "awd", mileage: 84000, engineCc: 1685, powerHp: 136, color: "Gri", status: "RESERVED", hue: 190 },
  { brand: "Lexus", model: "RX 450h", year: 2017, price: 28999, downPayment: 3000, body: "suv", fuel: "hybrid", transmission: "cvt", drivetrain: "awd", mileage: 112000, engineCc: 3456, powerHp: 313, color: "Alb perlat", status: "SOLD", hue: 45 },
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
  // admin user
  const email = (process.env.ADMIN_EMAIL ?? "office@inauto.md").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "schimba-parola";
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: "Admin", passwordHash: await bcrypt.hash(password, 10) },
    update: {},
  });
  console.log(`Admin: ${email} / ${password}`);

  const existing = await prisma.car.count();
  if (existing > 0) {
    console.log(`Skip demo cars — ${existing} cars already in DB`);
    return;
  }

  for (const c of demoCars) {
    const { hue, status, ...data } = c;
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
    const imgs = await makeImages(car.id, hue, `${c.brand} ${c.model}`);
    await prisma.carImage.createMany({
      data: imgs.map((i) => ({ carId: car.id, ...i, width: 1600, height: 1200 })),
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
