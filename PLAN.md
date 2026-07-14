# Plan

## Goal

Ship a reliable 90-second TeachKit demo for the OpenAI Build Week Education track.

## Acceptance checks

- A teacher can submit one page, one sample, or one topic.
- Successful live generation makes exactly two GPT-5.6 requests.
- Three differentiated worksheets assemble visibly.
- The final pack prints cleanly on A4.
- Fallback output is always labeled.
- Lint, type checks, tests, build, browser checks, and the security gate pass.

## Current checkpoint

Finish live API validation, then add one verified output language. Six original samples are ready. Deployment remains blocked until platform rate limits and spend controls pass the security gate.
