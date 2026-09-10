// Minimal typed client for the 999.md Partners API
// Docs: https://partners-api.999.md/api/documentation
// Auth: HTTP Basic — API key as username, empty password.

const BASE = "https://partners-api.999.md";

export function nnnEnabled() {
  return !!process.env.NNN_API_KEY && process.env.NNN_DRY_RUN !== "1";
}

function authHeader() {
  const key = process.env.NNN_API_KEY ?? "";
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
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
    throw new Error(`999.md API ${res.status} ${path}: ${text.slice(0, 500)}`);
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
}) {
  const q = new URLSearchParams({ lang: "ru", ...params });
  return request<{ options: { id: string; title: string }[] }>(
    `/dependent_options?${q}`
  );
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
