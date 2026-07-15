import { NextResponse } from "next/server";
import { searchOutlets } from "@/lib/db";
import { getSessionUser, ADMIN_ROLES } from "@/lib/auth";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Only a super admin can export data." }, { status: 403 });
  }

  try {
    const outlets = await searchOutlets("");

    const columns = [
      "outletId",
      "fullName",
      "phone",
      "phone2",
      "tin",
      "avgDropSize",
      "visitsPerMonth",
      "lat",
      "lng",
      "photoPath",
      "registeredBy",
      "registeredAt",
    ];

    const lines = [columns.join(",")];
    for (const outlet of outlets) {
      lines.push(columns.map((col) => csvEscape(outlet[col])).join(","));
    }
    const csv = lines.join("\n");

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="outlets_export_${date}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not reach the outlet database." }, { status: 502 });
  }
}
