import { NextResponse } from "next/server";
import { createOutlet, findOutletById, searchOutlets } from "@/lib/db";
import { resolveScannedText } from "@/lib/scan";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const outlets = await searchOutlets(q);
    return NextResponse.json({ outlets });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not reach the outlet database." }, { status: 502 });
  }
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

    const existing = await findOutletById(outletId);
    if (existing) {
      return NextResponse.json(
        { error: `This outlet (${outletId}) is already registered.`, existing },
        { status: 409 }
      );
    }

    const photoFile = photo && typeof photo.arrayBuffer === "function" && photo.size > 0 ? photo : null;

    const { ok, status, data } = await createOutlet(
      {
        outletId,
        scanSource: resolved.source,
        scanMatched: resolved.matched ? "1" : "0",
        fullName,
        phone,
        phone2,
        tin,
        avgDropSize: avgDropSizeRaw,
        visitsPerMonth: visitsPerMonthRaw,
        lat: lat || "",
        lng: lng || "",
        registeredBy: session.username,
      },
      photoFile
    );

    if (!ok) {
      return NextResponse.json(
        { error: data.error || "Server error while saving the outlet." },
        { status }
      );
    }

    return NextResponse.json({ outlet: data.outlet }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error while saving the outlet." }, { status: 500 });
  }
}
