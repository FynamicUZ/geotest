"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DraftTest, TestEditor } from "@/components/TestEditor";
import { getSignedInUsername } from "@/lib/clientAuth";

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [draft, setDraft] = useState<DraftTest | null>(null);
  const [authorUsername, setAuthorUsername] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const u = getSignedInUsername();
    if (u) setUsername(u);
    (async () => {
      const res = await fetch(`/api/tests/${id}?includeAnswers=1`);
      if (!res.ok) {
        setLoadError("Test not found");
        return;
      }
      const { test } = await res.json();
      setAuthorUsername(test.author.username);
      setDraft({
        name: test.name,
        description: test.description ?? "",
        timeLimitSec: test.timeLimitSec,
        questions: test.questions.map((q: any) => ({
          prompt: q.prompt,
          imageUrl: q.imageUrl,
          explanation: q.explanation,
          choices: q.choices.map((c: any) => ({
            text: c.text,
            isCorrect: c.isCorrect,
          })),
        })),
      });
    })();
  }, [id]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, test: draft }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    router.push(`/tests/${id}`);
  }

  async function remove() {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tests/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    router.push("/tests");
  }

  if (loadError) {
    return <div className="card text-white/70">{loadError}</div>;
  }
  if (!draft) {
    return <div className="text-white/50">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit test</h1>
      <div className="text-sm text-white/60">
        Created by @{authorUsername}. You'll need their password to save changes.
      </div>

      <TestEditor value={draft} onChange={setDraft} />

      <div className="card space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="label">Username</div>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <div className="label">Password</div>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="flex justify-between">
          <button
            type="button"
            className="btn-danger"
            onClick={remove}
            disabled={busy || !username || !password}
          >
            Delete test
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={busy || !username || !password}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
