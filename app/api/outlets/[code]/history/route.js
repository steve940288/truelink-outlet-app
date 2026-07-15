import { NextResponse } from "next/server";
import { getOutletHistory } from "@/lib/db";
import { getSessionUser, DASHBOARD_ROLES } from "@/lib/auth";

export async function GET(request, { params }) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!DASHBOARD_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to view change history." }, { status: 403 });
  }

  const outletId = decodeURIComponent(params.code);

  try {
    const changes = await getOutletHistory(outletId);
    return NextResponse.json({ changes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not reach the outlet database." }, { status: 502 });
  }
}
