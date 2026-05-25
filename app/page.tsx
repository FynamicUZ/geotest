import Link from "next/link";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-10">
        <h1 className="text-4xl font-semibold">Make & take MCQ tests</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          Build a multiple-choice test in seconds — manually or by uploading a
          JSON file. Share the name with anyone. Scores land on a public
          leaderboard.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/tests/new" className="btn-primary">
            Create a test
          </Link>
          <Link href="/tests" className="btn-ghost">
            Browse tests
          </Link>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-medium">Find a test</h2>
        <Suspense fallback={<div className="input">Loading…</div>}>
          <SearchBar />
        </Suspense>
        <p className="text-xs text-white/40">
          Search by test name. Open it, take it, climb the leaderboard.
        </p>
      </section>
    </div>
  );
}
