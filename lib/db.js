import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "outlets.json");

// Very small file-based store. Fine for an internal, low-concurrency tool
// (a handful of staff registering outlets at a time). Not meant for
// high-traffic/public use.

function readAll() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeAll(outlets) {
  fs.writeFileSync(DB_PATH, JSON.stringify(outlets, null, 2), "utf-8");
}

export function getAllOutlets() {
  return readAll();
}

export function findOutletById(outletId) {
  const outlets = readAll();
  const normalized = outletId.trim().toUpperCase();
  return outlets.find((o) => o.outletId.toUpperCase() === normalized) || null;
}

export function searchOutlets(query) {
  const outlets = readAll();
  if (!query) return outlets;
  const q = query.trim().toLowerCase();
  return outlets.filter(
    (o) =>
      o.outletId.toLowerCase().includes(q) ||
      o.fullName.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      (o.phone2 || "").includes(q) ||
      (o.tin || "").toLowerCase().includes(q)
  );
}

export function addOutlet(outlet) {
  const outlets = readAll();
  outlets.push(outlet);
  writeAll(outlets);
  return outlet;
}
