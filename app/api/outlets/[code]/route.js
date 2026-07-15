import { NextResponse } from "next/server";
import { findOutletById } from "@/lib/db";
import { resolveScannedText } from "@/lib/scan";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request, { params }) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const scannedText = decodeURIComponent(params.code);
  const resolved = resolveScannedText(scannedText);

  const outlet = findOutletById(resolved.id);

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
