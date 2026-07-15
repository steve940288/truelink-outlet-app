"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AccountBar from "@/components/AccountBar";
import { withBasePath } from "@/lib/config";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

const STEPS = ["Scan", "Details", "Location", "Photo", "Review"];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [scannedText, setScannedText] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [tin, setTin] = useState("");
  const [avgDropSize, setAvgDropSize] = useState("");
  const [visitsPerMonth, setVisitsPerMonth] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const handleScan = useCallback((text) => {
    setScannedText(text);
    setStep(1);
  }, []);

  const handleLocationChange = useCallback((newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canProceedFromDetails = fullName.trim() && phone.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("scannedText", scannedText);
      formData.append("fullName", fullName.trim());
      formData.append("phone", phone.trim());
      formData.append("phone2", phone2.trim());
      formData.append("tin", tin.trim());
      formData.append("avgDropSize", avgDropSize.trim());
      formData.append("visitsPerMonth", visitsPerMonth.trim());
      if (lat != null) formData.append("lat", lat);
      if (lng != null) formData.append("lng", lng);
      if (photoFile) formData.append("photo", photoFile);

      const res = await fetch(withBasePath("/api/outlets"), { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong while saving.");
        setSubmitting(false);
        return;
      }

      setSubmitted(data.outlet);
    } catch (err) {
      setSubmitError("Network error - check your connection and try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <main className="page">
        <div className="container">
          <div className="card" style={{ textAlign: "center" }}>
            <h2>Outlet Registered</h2>
            <div className="success-box">
              {submitted.fullName} ({submitted.outletId}) has been saved.
            </div>
            <Link href="/register" className="btn btn-primary" style={{ marginBottom: 10 }}>
              Register Another Outlet
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="top-bar">
          <Link href="/" className="back-link">
            ← Home
          </Link>
        </div>
        <AccountBar />
        <h2 style={{ marginTop: 0 }}>Register Outlet</h2>

        <div className="step-indicator">
          {STEPS.map((_, i) => (
            <div key={i} className={`step-dot ${i <= step ? "active" : ""}`} />
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Scan the Outlet Sticker</h3>
              <p style={{ fontSize: 14, color: "#1557A0" }}>
                Point the camera at either QR code on the sticker.
              </p>
              <QrScanner onScan={handleScan} active={step === 0} />
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Outlet Details</h3>
              <p style={{ fontSize: 13, color: "#1557A0", marginBottom: 16 }}>
                Scanned: <strong>{scannedText}</strong>
              </p>

              <div className="field">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Customer's full name" />
              </div>

              <div className="field">
                <label>
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXX"
                  type="tel"
                />
              </div>

              <div className="field">
                <label>Phone Number 2 (optional)</label>
                <input
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="09XXXXXXXX"
                  type="tel"
                />
              </div>

              <div className="field">
                <label>TIN Number (optional)</label>
                <input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="TIN number" />
              </div>

              <div className="field">
                <label>Average Drop Size (optional)</label>
                <input
                  value={avgDropSize}
                  onChange={(e) => setAvgDropSize(e.target.value)}
                  placeholder="e.g. quantity per delivery"
                  type="number"
                  inputMode="decimal"
                />
              </div>

              <div className="field">
                <label>Visits Per Month (optional)</label>
                <input
                  value={visitsPerMonth}
                  onChange={(e) => setVisitsPerMonth(e.target.value)}
                  placeholder="e.g. 4"
                  type="number"
                  inputMode="numeric"
                />
              </div>

              <button
                className="btn btn-primary"
                disabled={!canProceedFromDetails}
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Outlet Location</h3>
              <LocationPicker lat={lat} lng={lng} onChange={handleLocationChange} />
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => setStep(3)}
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Outlet Photo (optional)</h3>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Outlet preview"
                  style={{ width: "100%", borderRadius: 12, marginBottom: 16 }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ marginBottom: 16, width: "100%" }}
              />
              <p style={{ fontSize: 12, color: "#1557A0", marginBottom: 16 }}>
                Tap to take a photo, or choose one from your gallery.
              </p>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Next
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Review &amp; Submit</h3>
              {submitError && <div className="error-box">{submitError}</div>}
              <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 18 }}>
                <li>Scanned: {scannedText}</li>
                <li>Name: {fullName}</li>
                <li>Phone: {phone}</li>
                {phone2 && <li>Phone 2: {phone2}</li>}
                {tin && <li>TIN: {tin}</li>}
                {avgDropSize && <li>Average Drop Size: {avgDropSize}</li>}
                {visitsPerMonth && <li>Visits Per Month: {visitsPerMonth}</li>}
                <li>
                  Location:{" "}
                  {lat != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Not set"}
                </li>
                <li>Photo: {photoFile ? photoFile.name : "None"}</li>
              </ul>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Submit Registration"}
              </button>
            </div>
          )}
        </div>

        {step > 0 && !submitted && (
          <button
            className="btn btn-secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
        )}
      </div>
    </main>
  );
}
