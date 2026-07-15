"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AccountBar from "@/components/AccountBar";
import { withBasePath } from "@/lib/config";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

export default function ViewPage() {
  const [mode, setMode] = useState("search"); // "search" | "scan"
  const [query, setQuery] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [scanResult, setScanResult] = useState(null); // { found, outlet?, message? }
  const [scanning, setScanning] = useState(true);

  const fetchOutlets = useCallback(async (q) => {
    setLoading(true);
    const res = await fetch(withBasePath(`/api/outlets?q=${encodeURIComponent(q)}`));
    const data = await res.json();
    setOutlets(data.outlets || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mode === "search") {
      const t = setTimeout(() => fetchOutlets(query), 250);
      return () => clearTimeout(t);
    }
  }, [query, mode, fetchOutlets]);

  const handleScan = useCallback(async (text) => {
    setScanning(false);
    const res = await fetch(withBasePath(`/api/outlets/${encodeURIComponent(text)}`));
    const data = await res.json();
    setScanResult(data);
  }, []);

  const resetScan = () => {
    setScanResult(null);
    setScanning(true);
  };

  return (
    <main className="page">
      <div className="container">
        <div className="top-bar">
          <Link href="/" className="back-link">
            ← Home
          </Link>
        </div>
        <AccountBar />
        <h2 style={{ marginTop: 0 }}>View Registered Outlets</h2>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            className={mode === "search" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setMode("search")}
          >
            Search List
          </button>
          <button
            className={mode === "scan" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setMode("scan")}
          >
            Scan to View
          </button>
        </div>

        {mode === "search" && (
          <div className="card">
            <div className="field" style={{ marginBottom: 8 }}>
              <input
                placeholder="Search by name, phone, or ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {loading && <p style={{ fontSize: 14, color: "#1557A0" }}>Loading...</p>}
            {!loading && outlets.length === 0 && (
              <p style={{ fontSize: 14, color: "#1557A0" }}>No outlets found.</p>
            )}
            {!loading &&
              outlets.map((o) => (
                <div className="outlet-row" key={o.id}>
                  <div style={{ fontWeight: 700 }}>
                    {o.fullName}
                    <span className="pill">{o.outletId}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#1557A0" }}>{o.phone}</div>
                  {o.lat != null && (
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {o.lat.toFixed(5)}, {o.lng.toFixed(5)}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    Registered {new Date(o.registeredAt).toLocaleDateString()}
                    {o.registeredBy ? ` by ${o.registeredBy}` : ""}
                  </div>
                </div>
              ))}
          </div>
        )}

        {mode === "scan" && (
          <div className="card">
            {scanning && (
              <>
                <p style={{ fontSize: 14, color: "#1557A0" }}>
                  Scan either QR code on the outlet sticker.
                </p>
                <QrScanner onScan={handleScan} active={scanning} />
              </>
            )}

            {!scanning && scanResult && (
              <div>
                {scanResult.found ? (
                  <div>
                    <div className="success-box">Outlet found</div>
                    <h3 style={{ marginTop: 0 }}>{scanResult.outlet.fullName}</h3>
                    <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 18 }}>
                      <li>ID: {scanResult.outlet.outletId}</li>
                      <li>Phone: {scanResult.outlet.phone}</li>
                      {scanResult.outlet.phone2 && <li>Phone 2: {scanResult.outlet.phone2}</li>}
                      {scanResult.outlet.tin && <li>TIN: {scanResult.outlet.tin}</li>}
                      {scanResult.outlet.avgDropSize != null && (
                        <li>Average Drop Size: {scanResult.outlet.avgDropSize}</li>
                      )}
                      {scanResult.outlet.visitsPerMonth != null && (
                        <li>Visits Per Month: {scanResult.outlet.visitsPerMonth}</li>
                      )}
                      {scanResult.outlet.lat != null && (
                        <li>
                          Location: {scanResult.outlet.lat.toFixed(6)}, {scanResult.outlet.lng.toFixed(6)}
                        </li>
                      )}
                      <li>
                        Registered: {new Date(scanResult.outlet.registeredAt).toLocaleString()}
                        {scanResult.outlet.registeredBy ? ` by ${scanResult.outlet.registeredBy}` : ""}
                      </li>
                    </ul>
                    {scanResult.outlet.photoPath && (
                      <img
                        src={withBasePath(scanResult.outlet.photoPath)}
                        alt="Outlet"
                        style={{ width: "100%", borderRadius: 12, marginTop: 8 }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="error-box">{scanResult.message}</div>
                )}
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={resetScan}>
                  Scan Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
