import { NextResponse } from "next/server";
import { verifySessionToken, findUser, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
  const user = findUser(session.username);
  return NextResponse.json({
    loggedIn: true,
    username: session.username,
    displayName: user?.displayName || session.username,
  });
}
