"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountBar from "@/components/AccountBar";
import { withBasePath } from "@/lib/config";

const EDITABLE_FIELDS = [
  { key: "fullName", label: "Full Name", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "phone2", label: "Phone 2", type: "text" },
  { key: "tin", label: "TIN", type: "text" },
  { key: "avgDropSize", label: "Average Drop Size", type: "number" },
  { key: "visitsPerMonth", label: "Visits Per Month", type: "number" },
  { key: "lat", label: "Latitude", type: "number" },
  { key: "lng", label: "Longitude", type: "number" },
];

function EditForm({ outlet, onCancel, onSaved }) {
  const [form, setForm] = useState(() => {
    const initial = {};
    for (const f of EDITABLE_FIELDS) initial[f.key] = outlet[f.key] ?? "";
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(withBasePath(`/api/outlets/${encodeURIComponent(outlet.outletId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        setSaving(false);
        return;
      }
      onSaved(data.outlet, data.changed);
    } catch (err) {
      setError("Network error - try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eef1f5" }}>
      {error && <div className="error-box">{error}</div>}
      {EDITABLE_FIELDS.map((f) => (
        <div className="field" key={f.key} style={{ marginBottom: 10 }}>
          <label>{f.label}</label>
          <input
            type={f.type}
            value={form[f.key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ outletId }) {
  const [changes, setChanges] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(withBasePath(`/api/outlets/${encodeURIComponent(outletId)}/history`))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setChanges(data.changes))
      .catch(() => setError("Could not load history."));
  }, [outletId]);

  if (error) return <div className="error-box" style={{ marginTop: 10 }}>{error}</div>;
  if (changes === null) return <p style={{ fontSize: 13, color: "#1557A0", marginTop: 10 }}>Loading history...</p>;
  if (changes.length === 0) {
    return <p style={{ fontSize: 13, color: "#888", marginTop: 10 }}>No edits yet - only the original registration.</p>;
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eef1f5" }}>
      {changes.map((c, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 8, color: "#0F2044" }}>
          <strong>{c.fieldName}</strong>: {c.oldValue ?? "(empty)"} → {c.newValue ?? "(empty)"}
          <div style={{ fontSize: 11, color: "#888" }}>
            {c.changedBy} · {new Date(c.changedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // which outlet's edit form is open
  const [historyId, setHistoryId] = useState(null); // which outlet's history is open
  const [role, setRole] = useState(null);

  const fetchOutlets = useCallback(async (q) => {
    setLoading(true);
    const res = await fetch(withBasePath(`/api/outlets?q=${encodeURIComponent(q)}`));
    const data = await res.json();
    setOutlets(data.outlets || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch(withBasePath("/api/me"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.loggedIn && setRole(data.role));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchOutlets(query), 250);
    return () => clearTimeout(t);
  }, [query, fetchOutlets]);

  const handleSaved = (updatedOutlet, changed) => {
    setOutlets((prev) =>
      prev.map((o) => (o.outletId === updatedOutlet.outletId ? updatedOutlet : o))
    );
    setExpandedId(null);
  };

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="top-bar">
          <Link href="/" className="back-link">
            ← Home
          </Link>
        </div>
        <AccountBar />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ marginTop: 0 }}>Dashboard</h2>
          {role === "admin" && (
            <a
              href={withBasePath("/api/outlets/export")}
              className="btn btn-amber"
              style={{ padding: "8px 14px", fontSize: 13, width: "auto" }}
            >
              Export CSV
            </a>
          )}
        </div>

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
              <div className="outlet-row" key={o.outletId}>
                <div style={{ fontWeight: 700 }}>
                  {o.fullName}
                  <span className="pill">{o.outletId}</span>
                </div>
                <div style={{ fontSize: 13, color: "#1557A0" }}>{o.phone}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {o.avgDropSize != null && <>Avg drop: {o.avgDropSize} · </>}
                  {o.visitsPerMonth != null && <>Visits/mo: {o.visitsPerMonth} · </>}
                  {o.lat != null && (
                    <>
                      {o.lat.toFixed(5)}, {o.lng.toFixed(5)}
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>
                  Registered {new Date(o.registeredAt).toLocaleDateString()}
                  {o.registeredBy ? ` by ${o.registeredBy}` : ""}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === o.outletId ? null : o.outletId);
                      setHistoryId(null);
                    }}
                    style={{
                      background: "none",
                      border: "1.5px solid #1557A0",
                      color: "#1557A0",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {expandedId === o.outletId ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => {
                      setHistoryId(historyId === o.outletId ? null : o.outletId);
                      setExpandedId(null);
                    }}
                    style={{
                      background: "none",
                      border: "1.5px solid #888",
                      color: "#888",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {historyId === o.outletId ? "Hide History" : "History"}
                  </button>
                </div>

                {expandedId === o.outletId && (
                  <EditForm
                    outlet={o}
                    onCancel={() => setExpandedId(null)}
                    onSaved={handleSaved}
                  />
                )}
                {historyId === o.outletId && <HistoryPanel outletId={o.outletId} />}
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
