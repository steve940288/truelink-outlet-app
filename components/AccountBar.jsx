"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/config";

export default function AccountBar() {
  const [displayName, setDisplayName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(withBasePath("/api/me"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.loggedIn) setDisplayName(data.displayName);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch(withBasePath("/api/logout"), { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!displayName) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        color: "#1557A0",
        marginBottom: 12,
      }}
    >
      <span>Signed in as {displayName}</span>
      <button
        onClick={handleLogout}
        style={{
          background: "none",
          border: "none",
          color: "#B23A3A",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Log out
      </button>
    </div>
  );
}
