import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, findUser, DASHBOARD_ROLES, SESSION_COOKIE_NAME } from "@/lib/auth";

export default function DashboardLayout({ children }) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    redirect("/login");
  }

  const user = findUser(session.username);
  if (!user || !DASHBOARD_ROLES.includes(user.role)) {
    redirect("/");
  }

  return children;
}
