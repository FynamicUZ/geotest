"use client";

import { useState } from "react";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export type DraftChoice = { text: string; isCorrect: boolean };
export type DraftQuestion = {
  prompt: string;
  imageUrl: string | null;
  explanation: string | null;
  choices: DraftChoice[];
};
export type DraftTest = {
  name: string;
  description: string;
  timeLimitSec: number | null;
  questions: DraftQuestion[];
};

export const emptyQuestion = (): DraftQuestion => ({
  prompt: "",
  imageUrl: null,
  explanation: null,
  choices: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

export const emptyTest = (): DraftTest => ({
  name: "",
  description: "",
  timeLimitSec: null,
  questions: [emptyQuestion()],
});

export function TestEditor({
  value,
  onChange,
}: {
  value: DraftTest;
  onChange: (next: DraftTest) => void;
}) {
  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    const qs = value.questions.slice();
    qs[i] = { ...qs[i], ...patch };
    onChange({ ...value, questions: qs });
  }
  function updateChoice(qi: number, ci: number, patch: Partial<DraftChoice>) {
    const qs = value.questions.slice();
    const cs = qs[qi].choices.slice();
    cs[ci] = { ...cs[ci], ...patch };
    qs[qi] = { ...qs[qi], choices: cs };
    onChange({ ...value, questions: qs });
  }
  function setCorrect(qi: number, ci: number) {
    const qs = value.questions.slice();
    qs[qi] = {
      ...qs[qi],
      choices: qs[qi].choices.map((c, i) => ({ ...c, isCorrect: i === ci })),
    };
    onChange({ ...value, questions: qs });
  }
  function addQuestion() {
    onChange({ ...value, questions: [...value.questions, emptyQuestion()] });
  }
  function removeQuestion(i: number) {
    if (value.questions.length === 1) return;
    onChange({
      ...value,
      questions: value.questions.filter((_, idx) => idx !== i),
    });
  }
  function addChoice(qi: number) {
    const qs = value.questions.slice();
    qs[qi] = {
      ...qs[qi],
      choices: [...qs[qi].choices, { text: "", isCorrect: false }],
    };
    onChange({ ...value, questions: qs });
  }
  function removeChoice(qi: number, ci: number) {
    const qs = value.questions.slice();
    if (qs[qi].choices.length <= 2) return;
    const wasCorrect = qs[qi].choices[ci].isCorrect;
    const next = qs[qi].choices.filter((_, i) => i !== ci);
    if (wasCorrect && next.length > 0) next[0].isCorrect = true;
    qs[qi] = { ...qs[qi], choices: next };
    onChange({ ...value, questions: qs });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div>
          <div className="label">Test name</div>
          <input
            className="input"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. World Capitals"
            maxLength={200}
          />
        </div>
        <div>
          <div className="label">Description (optional)</div>
          <textarea
            className="input min-h-[80px]"
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            maxLength={2000}
          />
        </div>
        <div>
          <div className="label">Time limit in seconds (optional)</div>
          <input
            className="input max-w-xs"
            type="number"
            min={1}
            value={value.timeLimitSec ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                timeLimitSec: e.target.value
                  ? parseInt(e.target.value, 10)
                  : null,
              })
            }
            placeholder="No limit"
          />
        </div>
      </div>

      <div className="space-y-4">
        {value.questions.map((q, qi) => (
          <div key={qi} className="card space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-medium">Question {qi + 1}</div>
              <button
                type="button"
                className="text-rose-400 text-sm disabled:opacity-30"
                onClick={() => removeQuestion(qi)}
                disabled={value.questions.length === 1}
              >
                Remove
              </button>
            </div>
            <input
              className="input"
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              placeholder="Question text"
            />

            <ImageField
              imageUrl={q.imageUrl}
              onChange={(url) => updateQuestion(qi, { imageUrl: url })}
            />

            <div className="space-y-2">
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={c.isCorrect}
                    onChange={() => setCorrect(qi, ci)}
                    title="Mark correct"
                  />
                  <input
                    className="input"
                    value={c.text}
                    onChange={(e) =>
                      updateChoice(qi, ci, { text: e.target.value })
                    }
                    placeholder={`Choice ${ci + 1}`}
                  />
                  <button
                    type="button"
                    className="text-rose-400 text-sm disabled:opacity-30"
                    onClick={() => removeChoice(qi, ci)}
                    disabled={q.choices.length <= 2}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-sky-400"
                onClick={() => addChoice(qi)}
              >
                + Add choice
              </button>
            </div>

            <div>
              <div className="label">Explanation (shown after submit, optional)</div>
              <textarea
                className="input min-h-[60px]"
                value={q.explanation ?? ""}
                onChange={(e) =>
                  updateQuestion(qi, { explanation: e.target.value || null })
                }
              />
            </div>
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={addQuestion}>
          + Add question
        </button>
      </div>
    </div>
  );
}

function ImageField({
  imageUrl,
  onChange,
}: {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isCloudinaryConfigured();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImageToCloudinary(file);
      onChange(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="label">Image (optional)</div>
      {imageUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={imageUrl}
            alt=""
            className="max-w-[200px] max-h-32 object-contain rounded-md border border-white/10"
          />
          <button
            type="button"
            className="text-rose-400 text-sm"
            onClick={() => onChange(null)}
          >
            Remove image
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <input
            type="file"
            accept="image/*"
            onChange={onPick}
            disabled={busy || !configured}
            className="text-sm"
          />
          {!configured && (
            <div className="text-xs text-amber-300">
              Cloudinary not configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
              and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env to enable image
              uploads.
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              className="input text-xs"
              placeholder="…or paste an image URL"
              onChange={(e) => onChange(e.target.value || null)}
            />
          </div>
          {busy && <div className="text-xs text-white/60">Uploading…</div>}
          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
}
