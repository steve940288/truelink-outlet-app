// Talks to the PHP + MySQL API hosted on cPanel (outlets_api.php) instead of
// local storage - Vercel's serverless functions don't have persistent disk,
// so the actual outlet data lives on your own hosting, not on Vercel.

const API_BASE = process.env.PHP_API_URL; // e.g. https://truelink.et/registeroutlets-api/outlets_api.php
const API_KEY = process.env.PHP_API_KEY;

function assertConfigured() {
  if (!API_BASE || !API_KEY) {
    throw new Error(
      "PHP_API_URL and PHP_API_KEY environment variables must be set (see README)."
    );
  }
}

export async function searchOutlets(query) {
  assertConfigured();
  const url = new URL(API_BASE);
  url.searchParams.set("action", "list");
  if (query) url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PHP API list failed: ${res.status}`);
  }
  const data = await res.json();
  return data.outlets || [];
}

export async function findOutletById(outletId) {
  assertConfigured();
  const url = new URL(API_BASE);
  url.searchParams.set("action", "get");
  url.searchParams.set("outletId", outletId);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`PHP API get failed: ${res.status}`);
  }
  const data = await res.json();
  return data.outlet || null;
}

/**
 * Forwards a registration (including the photo file, if any) to the PHP API.
 * `fields` is a plain object of form values; `photoFile` is a web File/Blob
 * (from the incoming request's formData()) or null.
 * Returns { ok, status, data } - caller handles status codes (409, etc.)
 */
export async function createOutlet(fields, photoFile) {
  assertConfigured();
  const url = new URL(API_BASE);
  url.searchParams.set("action", "create");

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }
  if (photoFile && photoFile.size > 0) {
    formData.append("photo", photoFile, photoFile.name || "photo.jpg");
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "X-Api-Key": API_KEY },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Edits an outlet's editable fields. `fields` should include the CURRENT
 * (possibly unchanged) values for: fullName, phone, phone2, tin,
 * avgDropSize, visitsPerMonth, lat, lng - the PHP side diffs against the DB
 * and only updates/logs what actually changed.
 */
export async function updateOutlet(outletId, fields, changedBy) {
  assertConfigured();
  const url = new URL(API_BASE);
  url.searchParams.set("action", "update");

  const formData = new FormData();
  formData.append("outletId", outletId);
  formData.append("changedBy", changedBy);
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value === null || value === undefined ? "" : String(value));
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "X-Api-Key": API_KEY },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getOutletHistory(outletId) {
  assertConfigured();
  const url = new URL(API_BASE);
  url.searchParams.set("action", "history");
  url.searchParams.set("outletId", outletId);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PHP API history failed: ${res.status}`);
  }
  const data = await res.json();
  return data.changes || [];
}
