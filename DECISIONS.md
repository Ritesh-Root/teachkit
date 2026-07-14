# Decisions

## 2026-07-14

- Use the selected Editorial Lesson Studio frontend direction: Direction 1's warm teacher-focused shell plus Direction 2's four-stage progress rail, source-analysis strip, worksheet streaming states, and completion toolbar.
- Keep the existing A4 print presentation separate from the more dynamic on-screen generation experience.
- On mobile, move the live lesson-pack preview above the source card after generation starts so progress is visible without scrolling past the intake form.
- When the golden fallback is active, label its metadata and output as an authored demo pack instead of implying that GPT-5.6 analyzed the submitted source.
- Use one `POST /api/lesson-pack` route so clients cannot invoke analysis and generation separately.
- Use the `gpt-5.6` alias for both stages.
- Preserve exactly two model requests. Do not retry the model on parse or transport failure.
- Set OpenAI SDK retries to zero and use a whole-pipeline deadline below the serverless timeout.
- Use strict Zod schemas and Structured Outputs instead of loose JSON parsing.
- Stream only complete, validated worksheet objects to the browser.
- Use an explicit golden fallback. Never claim it came from the uploaded source.
- Keep the app English-only until the full English flow and print layout pass.
- Use browser printing instead of a PDF dependency.
- Use explicit A4 print CSS and print fallback provenance when the golden pack is active.
- Cap images at 4 MB to stay below Vercel's request-body ceiling, then validate both MIME declaration and file signature.
- Shed excess concurrency in each server instance, while requiring platform rate limits before deployment.
- Ship only original or clearly licensed sample pages.
- Use MIT for application code and CC BY 4.0 for TeachKit sample pages.
- Keep the Figma-selected source card compact and make every judge-ready option discoverable by placing the six original samples in a two-column, keyboard-accessible grid.
- Treat Codex credits and OpenAI API billing as separate. Never describe the event credit grant as API funding.
- Do not reuse ChatGPT browser, Codex CLI, or Codex SDK session credentials in the public application. Subscription-backed Codex execution is limited to trusted local workflows; the public lesson-generation route keeps the Platform API-key architecture.
- Allow a public fallback-only preview only when it has an always-visible preview banner and does not send the selected source to OpenAI.
- Keep one canonical submission checklist in `SUBMISSION.md` and block any claim that is not backed by code or recorded runtime evidence.
