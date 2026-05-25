"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/tests?q=${encodeURIComponent(query)}` : "/tests");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        className="input"
        placeholder="Type a test name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="btn-primary" type="submit">
        Search
      </button>
    </form>
  );
}
