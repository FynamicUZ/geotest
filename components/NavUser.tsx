"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSignedInUsername, signOut } from "@/lib/clientAuth";

export default function NavUser() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(getSignedInUsername());
    const onStorage = () => setName(getSignedInUsername());
    window.addEventListener("storage", onStorage);
    window.addEventListener("geotest:auth", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("geotest:auth", onStorage);
    };
  }, []);

  if (!name) {
    return (
      <>
        <Link href="/profile/signin">Sign in</Link>
        <Link href="/profile/new" className="btn-ghost">
          Sign up
        </Link>
      </>
    );
  }
  return (
    <>
      <span className="text-white/70">@{name}</span>
      <button
        className="btn-ghost"
        onClick={() => {
          signOut();
          setName(null);
        }}
      >
        Sign out
      </button>
    </>
  );
}
