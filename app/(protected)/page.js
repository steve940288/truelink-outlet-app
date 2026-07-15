import Link from "next/link";
import AccountBar from "@/components/AccountBar";

export default function HomePage() {
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
        <Link href="/view" className="btn btn-secondary">
          View Registered
        </Link>
      </div>
    </main>
  );
}
