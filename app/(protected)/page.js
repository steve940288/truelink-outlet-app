import Link from "next/link";
import { cookies } from "next/headers";
import AccountBar from "@/components/AccountBar";
import { verifySessionToken, findUser, DASHBOARD_ROLES, SESSION_COOKIE_NAME } from "@/lib/auth";

export default function HomePage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const user = session ? findUser(session.username) : null;
  const canSeeDashboard = user && DASHBOARD_ROLES.includes(user.role);

  return (
    <main className="page">
      <div className="container">
        <AccountBar />
        <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
          <h1 style={{ fontSize: 34, margin: 0 }}>True Link PLC</h1>
          <p style={{ color: "#1557A0", marginTop: 4 }}>Outlet Registration</p>
        </div>

        <Link href="/register" className="btn btn-primary" style={{ marginBottom: 14 }}>
          Register Outlet
        </Link>
        <Link href="/view" className="btn btn-secondary" style={{ marginBottom: canSeeDashboard ? 14 : 0 }}>
          View Registered
        </Link>
        {canSeeDashboard && (
          <Link href="/dashboard" className="btn btn-amber">
            Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
