import { NextResponse } from "next/server";
import { findOutletById, updateOutlet } from "@/lib/db";
import { resolveScannedText } from "@/lib/scan";
import { verifySessionToken, getSessionUser, DASHBOARD_ROLES, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request, { params }) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const scannedText = decodeURIComponent(params.code);
  const resolved = resolveScannedText(scannedText);

  let outlet;
  try {
    outlet = await findOutletById(resolved.id);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not reach the outlet database." }, { status: 502 });
  }

  if (!outlet) {
    return NextResponse.json(
      {
        found: false,
        resolved,
        message: resolved.matched
          ? `No outlet registered yet for ${resolved.id}.`
          : `Scanned code "${scannedText}" wasn't recognized (mapping file may be missing or out of date).`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ found: true, outlet });
}

// Edits an outlet - dashboard/admin roles only. `params.code` here is the
// real outletId directly (not a scanned QR value).
export async function PATCH(request, { params }) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!DASHBOARD_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to edit outlets." }, { status: 403 });
  }

  const outletId = decodeURIComponent(params.code);

  try {
    const body = await request.json();
    const { ok, status, data } = await updateOutlet(
      outletId,
      {
        fullName: body.fullName,
        phone: body.phone,
        phone2: body.phone2,
        tin: body.tin,
        avgDropSize: body.avgDropSize,
        visitsPerMonth: body.visitsPerMonth,
        lat: body.lat,
        lng: body.lng,
      },
      user.username
    );

    if (!ok) {
      return NextResponse.json({ error: data.error || "Failed to save changes." }, { status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error while saving changes." }, { status: 500 });
  }
}
