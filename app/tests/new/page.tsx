"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DraftTest,
  TestEditor,
  emptyTest,
} from "@/components/TestEditor";
import { getSignedInUsername } from "@/lib/clientAuth";

type Mode = "manual" | "json";

const JSON_EXAMPLE = `{
  "name": "World Capitals",
  "description": "Quick geography quiz",
  "timeLimitSec": 300,
  "questions": [
    {
      "prompt": "Capital of France?",
      "imageUrl": null,
      "explanation": "Paris has been the capital since 987 AD.",
      "choices": [
        { "text": "Paris",     "isCorrect": true  },
        { "text": "Lyon",      "isCorrect": false },
        { "text": "Nice",      "isCorrect": false },
        { "text": "Marseille", "isCorrect": false }
      ]
    }
  ]
}`;

export default function NewTestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");
  const [draft, setDraft] = useState<DraftTest>(emptyTest());
  const [jsonText, setJsonText] = useState(JSON_EXAMPLE);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u = getSignedInUsername();
    if (u) setUsername(u);
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    let payload: DraftTest;
    if (mode === "manual") {
      payload = draft;
    } else {
      try {
        payload = JSON.parse(jsonText);
      } catch (err) {
        setBusy(false);
        setError(`Invalid JSON: ${(err as Error).message}`);
        return;
      }
    }
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, test: payload }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    router.push(`/tests/${data.test.id}`);
  }

  function previewJson() {
    setJsonError(null);
    try {
      JSON.parse(jsonText);
      setJsonError(null);
    } catch (err) {
      setJsonError((err as Error).message);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setJsonText(text);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create a test</h1>

      <div className="flex gap-2">
        <button
          type="button"
          className={`tab ${mode === "manual" ? "tab-active" : ""}`}
          onClick={() => setMode("manual")}
        >
          Manual builder
        </button>
        <button
          type="button"
          className={`tab ${mode === "json" ? "tab-active" : ""}`}
          onClick={() => setMode("json")}
        >
          Upload JSON
        </button>
      </div>

      {mode === "manual" ? (
        <TestEditor value={draft} onChange={setDraft} />
      ) : (
        <div className="card space-y-3">
          <div className="text-sm text-white/70">
            Paste JSON below or upload a <code>.json</code> file. Schema: top-level{" "}
            <code>name</code>, optional <code>description</code>,{" "}
            <code>timeLimitSec</code>, and an array of <code>questions</code>.
            Each question needs <code>prompt</code>, optional <code>imageUrl</code>{" "}
            and <code>explanation</code>, plus a <code>choices</code> array (≥2)
            where exactly one has <code>isCorrect: true</code>.
          </div>
          <input
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="text-sm"
          />
          <textarea
            className="input font-mono text-xs min-h-[320px]"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={previewJson}>
              Validate JSON
            </button>
            {jsonError && <span className="error self-center">{jsonError}</span>}
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="text-sm text-white/70">
          Confirm your profile credentials to save this test.
        </div>
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
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={busy || !username || !password}
        >
          {busy ? "Saving…" : "Save test"}
        </button>
      </div>
    </div>
  );
}
