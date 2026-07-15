import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { addOutlet, findOutletById, searchOutlets } from "@/lib/db";
import { resolveScannedText } from "@/lib/scan";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const outlets = searchOutlets(q).sort(
    (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)
  );
  return NextResponse.json({ outlets });
}

export async function POST(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const formData = await request.formData();

    const scannedText = (formData.get("scannedText") || "").toString();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const phone2 = (formData.get("phone2") || "").toString().trim();
    const tin = (formData.get("tin") || "").toString().trim();
    const avgDropSizeRaw = (formData.get("avgDropSize") || "").toString().trim();
    const visitsPerMonthRaw = (formData.get("visitsPerMonth") || "").toString().trim();
    const lat = formData.get("lat");
    const lng = formData.get("lng");
    const photo = formData.get("photo");

    if (!scannedText) {
      return NextResponse.json({ error: "Missing scanned QR data." }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const resolved = resolveScannedText(scannedText);
    const outletId = resolved.id;

    const existing = findOutletById(outletId);
    if (existing) {
      return NextResponse.json(
        { error: `This outlet (${outletId}) is already registered.`, existing },
        { status: 409 }
      );
    }

    let photoPath = null;
    if (photo && typeof photo.arrayBuffer === "function" && photo.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = (photo.name && photo.name.split(".").pop()) || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      const buffer = Buffer.from(await photo.arrayBuffer());
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      photoPath = `/uploads/${filename}`;
    }

    const outlet = {
      id: uuidv4(),
      outletId,
      scanSource: resolved.source, // "url" or "code"
      scanMatched: resolved.matched, // false if a right-QR code wasn't found in the mapping file
      fullName,
      phone,
      phone2: phone2 || null,
      tin: tin || null,
      avgDropSize: avgDropSizeRaw ? parseFloat(avgDropSizeRaw) : null,
      visitsPerMonth: visitsPerMonthRaw ? parseInt(visitsPerMonthRaw, 10) : null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      photoPath,
      registeredBy: session.username,
      registeredAt: new Date().toISOString(),
    };

    addOutlet(outlet);
    return NextResponse.json({ outlet }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error while saving the outlet." }, { status: 500 });
  }
}
