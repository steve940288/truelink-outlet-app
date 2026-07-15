"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ELEMENT_ID = "qr-scanner-region";

export default function QrScanner({ onScan, active = true }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (cancelled) return;
          onScan(decodedText);
        },
        () => {
          // per-frame decode failures are normal while aiming the camera - ignore
        }
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            "Couldn't access the camera. Check camera permissions for this site, and that you're on HTTPS (or localhost)."
          );
          setStarting(false);
        }
        console.error(err);
      });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, [active, onScan]);

  return (
    <div style={{ width: "100%" }}>
      <div
        id={ELEMENT_ID}
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          borderRadius: 16,
          overflow: "hidden",
          background: "#0F2044",
        }}
      />
      {starting && !error && (
        <p style={{ textAlign: "center", color: "#1557A0", marginTop: 12 }}>
          Starting camera...
        </p>
      )}
      {error && (
        <p style={{ textAlign: "center", color: "#B23A3A", marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}
