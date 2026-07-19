# 020 — Draft, independent verification, and repairs

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Build + verify (gates G2–G4) |
| Status after event | Verified after two repairs |

## Draft

`biography.md` written by the builder: 208-word paragraph + SOURCES & CONFIDENCE note.

## Independent verification (G3)

A separate adversarial verifier agent re-fetched persimmons.studio, simmonsbench.com, the fanout GitHub repo, aiformortals.co, and channel signals, then audited every claim.

Verdict: **conditional PASS** — word count 208/150–250 pass; 10 claims SUPPORTED, 2 PARTIAL, **0 fabricated**; all five quotes verbatim; zero Doobie Brothers contamination; sources mapping complete.

## Defects found and repaired

1. **"a YouTube channel called AI for Mortals"** — live sources title the channel "Pat Simmons" (@per_simmons); "AI for Mortals" is his newsletter/brand (simmonsbench.com: "part of AI for Mortals… daily email newsletter"; aiformortals.co). This wording originated in the benchmark prompt itself and survived into the draft unexamined — the verifier caught it. Repaired to "On his YouTube channel, under the banner he called AI for Mortals" and the sources note now states the distinction explicitly.
2. **"He built no models"** — no source mentions models specifically; only "I do not [build AI tools]." Overreach removed; sentence now tracks the source exactly.

## Lesson

The benchmark prompt's own framing is not evidence. Its phrase "the 'AI for Mortals' YouTube channel" is contradicted by the subject's live pages; grounding rules apply to the prompt's assertions too.

## Next gate

G5 closure.
