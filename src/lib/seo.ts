import { site } from "./site";

// hreflang alternates for a path ("" = homepage, "/auto", "/auto/slug"...)
export function localizedAlternates(path: string) {
  const ro = `${site.url}${path || "/"}`;
  const ru = `${site.url}/ru${path}`;
  return {
    canonical: undefined as string | undefined, // set per locale below
    languages: { ro, ru, "x-default": ro },
  };
}

export function canonicalFor(locale: string, path: string) {
  return locale === "ru" ? `${site.url}/ru${path}` : `${site.url}${path || "/"}`;
}

export function autoDealerJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.name,
    url: site.url,
    email: site.email,
    telephone: `+${site.phones[0]}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lon,
    },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    })),
  };
}

export function vehicleJsonLd(car: {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  body: string;
  color?: string | null;
  engineCc?: number | null;
  descriptionRo: string;
  slug: string;
  imageUrls: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.brand} ${car.model} ${car.year}`,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "KMT",
    },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    bodyType: car.body,
    color: car.color ?? undefined,
    vehicleEngine: car.engineCc
      ? {
          "@type": "EngineSpecification",
          engineDisplacement: {
            "@type": "QuantitativeValue",
            value: car.engineCc,
            unitCode: "CMQ",
          },
        }
      : undefined,
    description: car.descriptionRo || undefined,
    image: car.imageUrls,
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${site.url}/auto/${car.slug}`,
      seller: { "@type": "AutoDealer", name: site.name, url: site.url },
    },
  };
}
