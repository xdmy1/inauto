// Minimal typed client for the 999.md Partners API
// Docs: https://partners-api.999.md/api/documentation
// Auth: HTTP Basic — API key as username, empty password.

const BASE = "https://partners-api.999.md";

/** an API key is present — reading (import) is possible */
export function nnnConfigured() {
  return !!process.env.NNN_API_KEY;
}

/** key present AND dry-run off — writing (create/update adverts) is real */
export function nnnEnabled() {
  return nnnConfigured() && process.env.NNN_DRY_RUN !== "1";
}

export type NnnMode = "live" | "read-only" | "off";

/** live = full two-way sync, read-only = import works but posting is simulated */
export function nnnMode(): NnnMode {
  if (!nnnConfigured()) return "off";
  return nnnEnabled() ? "live" : "read-only";
}

function authHeader() {
  const key = process.env.NNN_API_KEY ?? "";
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export class NnnApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new NnnApiError(
      res.status,
      `999.md API ${res.status} ${path}: ${text.slice(0, 500)}`
    );
  }
  return (await res.json()) as T;
}

// ——— types (subset we use) ———

export type NnnFeature = {
  id: string;
  title: string;
  type: string;
  required: boolean;
  units: string[] | null;
  options: { id: string; title: string }[] | null;
  depends_on: string | null;
};

export type NnnFeaturesResponse = {
  features_groups: { title: string; features: NnnFeature[] }[];
};

export type NnnFeatureValue = {
  id: string;
  value: unknown;
  unit?: string;
};

export type NnnAdvertState =
  | "public"
  | "blocked"
  | "blocked_commercial"
  | "need_pay"
  | "hidden"
  | "expired";

export type NnnAdvertListItem = {
  id: string;
  title: string;
  state: NnnAdvertState | string;
  categories?: {
    category?: { id: string; title: string; url: string };
    subcategory?: { id: string; title: string; url: string };
  };
  type?: string;
  views_counter?: number;
  posted?: string;
  republished?: string;
  expire?: string;
};

export type NnnAdvertListResponse = {
  adverts: NnnAdvertListItem[];
  page_size: number;
  page: number;
  subtotal: number;
  total: number;
};

export type NnnAdvert = {
  id: string;
  state: NnnAdvertState | string;
  categories?: NnnAdvertListItem["categories"];
  offer_type?: { title: string; value: string };
  title?: string;
  body?: string;
  price?: { value: number; unit: string };
  features: NnnFeatureValue[];
};

// ——— endpoints ———

export function getFeatures(params: {
  category_id: string;
  subcategory_id: string;
  offer_type: string;
  lang?: string;
}) {
  const q = new URLSearchParams({ lang: "ru", ...params });
  return request<NnnFeaturesResponse>(`/features?${q}`);
}

export function getDependentOptions(params: {
  subcategory_id: string;
  dependency_feature_id: string;
  parent_option_id: string;
  lang?: string;
}) {
  const q = new URLSearchParams({ lang: "ru", ...params });
  return request<{ options: { id: string; title: string }[] }>(
    `/dependent_options?${q}`
  );
}

export function listAdverts(params: {
  page?: number;
  page_size?: number;
  states?: string;
  lang?: string;
} = {}) {
  const q = new URLSearchParams({
    lang: params.lang ?? "ro",
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 100),
    ...(params.states ? { states: params.states } : {}),
  });
  return request<NnnAdvertListResponse>(`/adverts?${q}`);
}

export function getAdvert(advertId: string, lang = "ro") {
  const q = new URLSearchParams({ lang });
  return request<NnnAdvert>(`/adverts/${advertId}?${q}`);
}

export function getAdvertFeatures(advertId: string, lang = "ru") {
  const q = new URLSearchParams({ lang });
  return request<NnnFeaturesResponse>(`/adverts/${advertId}/features?${q}`);
}

export async function uploadImage(buf: Buffer, filename: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)]), filename);
  const res = await request<{ image_id: string }>(`/images`, {
    method: "POST",
    body: form,
  });
  return res.image_id;
}

export function createAdvert(body: {
  category_id: string;
  subcategory_id: string;
  offer_type: string;
  features: NnnFeatureValue[];
}) {
  return request<{ advert: { id: string } }>(`/adverts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdvert(
  advertId: string,
  body: { features: NnnFeatureValue[]; offer_type?: string }
) {
  return request<{ success: boolean }>(`/adverts/${advertId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function republishAdvert(advertId: string) {
  return request<{ success: boolean }>(`/adverts/${advertId}/republish`, {
    method: "POST",
  });
}

export function setAccessPolicy(advertId: string, policy: "private" | "public") {
  return request<{ success: boolean }>(`/adverts/${advertId}/access_policy`, {
    method: "PUT",
    body: JSON.stringify({ access_policy: policy }),
  });
}

export function getCash() {
  return request<{ cash: number }>(`/cash`);
}

// ——— helpers ———

/** public page of an advert on 999.md */
export function nnnAdvertUrl(advertId: string, locale: "ro" | "ru" = "ro") {
  return `https://999.md/${locale}/${advertId}`;
}

/** CDN url of an advert photo (image ids come from the upload_images feature) */
export function nnnImageUrl(imageId: string, size: "320x240" | "900x900" = "900x900") {
  // ids look like "<hash>.jpg?metadata=..." — the CDN path wants only the file
  const file = imageId.split("?")[0];
  return `https://i.simpalsmedia.com/999.md/BoardImages/${size}/${file}`;
}
