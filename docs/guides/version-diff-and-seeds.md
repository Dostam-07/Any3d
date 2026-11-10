# Version diff, seed lock and Ask (Phase 4)

Source: `src/lib/diff.ts`, `src/components/VersionDiff.tsx`, `src/lib/surprise-deck.ts`, `server/llm/mutator.js`, `server/llm/service.js`.

## Version diff

`diffScene(oldCode, newCode)` produces hunks with 3 lines of context (LCS). `revertHunk(code, hunk)` applies a single hunk's reversal and **refuses a stale hunk** rather than corrupting an edit. `VersionDiff.tsx` is a portalled dialog with version selects and per-hunk revert. `scripts/test-diff.ts` — 23 assertions.

## Seed lock

`GeneratorConfig.seed` and `ChatMessage.seed`. When locked, the client sends `seed` to `/api/generate`; the server forces temperature to 0 (Ollama `options.seed`, Gemini `generationConfig.seed`). The seed is stored on the version and restored on Restore. Re-running a locked seed on the same model reproduces the scene within a visual diff threshold.

## Surprise deck

`src/lib/surprise-deck.ts` — 10 curated place × activity × light × palette cards. `drawSurprise()` returns one card; "Surprise me" / "Surprise" fills the composer without sending.

## Ask about the scene

Read-only chat-mutate. `askScene()` + `answerFromCode()` in `server/llm/mutator.js`; `POST /api/ask-scene`. Returns `{ answer, changed: false, readOnly: true }` with **no `code` field**, so it structurally cannot create a version. A deterministic code-grounded answerer covers the no-model case. Blank question → 400.