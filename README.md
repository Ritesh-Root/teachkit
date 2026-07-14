# TeachKit

TeachKit turns a textbook page into a printable, differentiated lesson pack. A teacher can photograph a page or type a topic, then get guided, independent, and challenge worksheets, a five-question exit quiz, discussion prompts, and a parent note.

This project is being built for the Education track of OpenAI Build Week 2026.

## Current status

The English workflow is implemented locally:

- single-page image, sample, or topic intake
- one server route with exactly two GPT-5.6 requests on a successful run
- strict Zod schemas for source analysis and lesson-pack generation
- streamed worksheet assembly using newline-delimited JSON
- explicit golden fallback when the API key is missing or generation fails
- responsive classroom-editorial interface
- visually verified five-page A4 browser printing
- six original, preloaded textbook-style sample pages across four subjects
- 22 focused automated tests

Multilingual validation, deployment controls, and a live API smoke test are still pending. The submission must describe the current product as English-only until another language passes the complete generation and print flow.

## Product flow

```text
Teacher adds a page or topic
            |
            v
POST /api/lesson-pack
            |
            +--> GPT-5.6 request 1: source analysis
            |      topic, grade, subject, language, concepts
            |
            +--> GPT-5.6 request 2: structured lesson pack stream
                   guided, independent, challenge, quiz, discussion, parent note
            |
            v
Browser print dialog
```

Both image and topic inputs use the same two-stage pipeline. The server owns the API key, prompts, schemas, call budget, input limits, and fallback. The client never calls OpenAI directly.

## Why the worksheets are different

The three levels share one learning objective but change the kind of thinking required:

- Guided Practice provides vocabulary, a worked example, hints, and larger answer spaces.
- Independent Practice asks students to apply and explain without step-by-step help.
- Challenge asks students to transfer the concept, justify a claim, or design something new.

The labels avoid ranking students as easy, medium, or hard. Each level also uses a number and border pattern, so the distinction survives grayscale printing.

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm
- an OpenAI API key for live generation

OpenAI Build Week provides Codex credits, not an OpenAI API key or separate API credits. Live generation requires an OpenAI API project with its own billing or quota. Create the key in the [OpenAI API dashboard](https://platform.openai.com/settings/organization/api-keys), keep it server-side, and review the project's spend limit before running the app. The [Build Week resources page](https://openai.devpost.com/resources) describes the event credit grant.

Install and configure the app:

```bash
npm install
cp .env.example .env.local
```

Add your key to `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose the Water Cycle sample and select **Build lesson pack**.

If no API key is configured, TeachKit clearly labels and shows the authored golden pack. It does not pretend the fallback came from the submitted page.

## Hosted preview modes

TeachKit has two deployment states:

- A fallback-only design and print preview can run without an API key. It displays a yellow preview banner, never sends the selected source to OpenAI, and always returns the labeled authored water-cycle pack.
- The final judge-facing deployment requires a server-side OpenAI Platform API key, a successful live GPT-5.6 validation, edge rate limits, and project spend controls.

A ChatGPT or Codex subscription session is not used as the public application credential. OpenAI documents ChatGPT sign-in for local Codex work and warns against exposing Codex execution in public environments. General OpenAI API calls use Platform API credentials. See [Codex authentication](https://learn.chatgpt.com/docs/auth) and the [API authentication reference](https://developers.openai.com/api/reference/overview#authentication).

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers:

- strict schema validation for the golden analysis and pack
- incremental extraction of complete worksheet objects from partial JSON
- exactly two mocked model requests on a successful run
- disabled SDK transport retries and a bounded request timeout
- no model retry after malformed generation output
- invalid multi-source requests making zero model calls
- mismatched image signatures
- per-instance concurrency shedding with a `429` response
- the explicit no-key fallback event sequence
- six unique sample records with matching PNG and SVG assets

## OpenAI integration

TeachKit uses the Responses API and the `gpt-5.6` alias, which routes to GPT-5.6 Sol according to the current [OpenAI model guide](https://developers.openai.com/api/docs/guides/latest-model). The first request accepts image or text input. The second request streams a strict lesson-pack schema.

The implementation uses:

- `store: false` on both requests
- `detail: "original"` for textbook images
- low reasoning effort for source analysis
- medium reasoning effort for lesson-pack generation
- bounded output tokens and input size
- a privacy-preserving hashed browser identifier when available
- no model retry, which preserves the exactly-two-request contract
- a 45-second whole-pipeline deadline below the 60-second function limit

Structured Outputs enforce the response shape. The server buffers JSON deltas only long enough to identify a complete worksheet object, validates that object, then streams it to the browser. See the official guides for [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [image inputs](https://developers.openai.com/api/docs/guides/images-vision).

## Sample data

TeachKit includes six original pages covering science, math, history, and English. Each source SVG has a rendered PNG beside it for the vision flow. The pages are marked CC BY 4.0 so judges can test the app without uploading copyrighted textbook material.

Commercial textbook scans must not be committed to this repository. When live generation is enabled, user uploads are processed in memory and sent to OpenAI. TeachKit does not intentionally persist or log their contents. The fallback-only preview does not send the selected source to OpenAI. OpenAI API data is not used for training by default, but abuse-monitoring retention can still apply under the project's [API data controls](https://platform.openai.com/docs/guides/your-data). Do not upload student names, handwriting, or other personal information.

## How Codex shaped the build

Most core functionality is being authored in one named Codex thread so the final submission can use that thread's `/feedback` Session ID.

Codex work recorded during the build:

1. Inspected the greenfield workspace and created a standalone Next.js repository instead of writing into the home-directory Git repository.
2. Checked current OpenAI, Next.js, shadcn/ui, and Vercel documentation before choosing API and framework patterns.
3. Used independent architecture and product reviews to challenge the brief. Both reviews found a contradiction between "exactly two calls" and "retry once."
4. Chose exactly two requests with no model retry. Failures use a clearly labeled local fallback.
5. Kept one public route and one server-only OpenAI module so the call budget can be tested.
6. Built and inspected desktop and mobile browser states with Playwright before wiring the live route.
7. Added tests for the two-call contract, incremental stream parsing, request validation, concurrency shedding, and fallback behavior.
8. Ran independent code and security reviews, then disabled SDK retries, added a whole-pipeline deadline, tightened image validation, added security headers, and made fallback provenance printable.
9. Rendered the final pack through Chromium and inspected all five A4 pages for clipping, overlap, and page-break defects.
10. Used the selected Figma Editorial Lesson Studio direction to keep the six-sample selector and privacy copy consistent with the teacher-focused interface.
11. Added opt-in, privacy-safe live-validation tracing so one approved run can prove two upstream requests and two schema-valid results without logging source or output content.

The main decisions are tracked in [DECISIONS.md](DECISIONS.md). Current work and the next checkpoint are in [CONTINUATION.md](CONTINUATION.md).
The judge-facing artifact checklist and draft submission copy are in [SUBMISSION.md](SUBMISSION.md). The recording script is in [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md), and the teacher review protocol is in [EVALUATION.md](EVALUATION.md).

## Project structure

```text
src/app/page.tsx                    single-page entry
src/app/api/lesson-pack/route.ts    validation, streaming, fallback
src/components/teachkit-app.tsx     intake and client state machine
src/components/lesson-pack.tsx      screen and print renderer
src/lib/openai.ts                   only OpenAI call site
src/lib/lesson-pack.ts              strict shared schemas and types
src/lib/incremental-json.ts         worksheet extraction from JSON deltas
src/lib/prompts.ts                  analysis and generation instructions
src/lib/golden-pack.ts              authored demo-safe fallback
src/lib/sample-pages.ts             original judge-ready sample catalog
public/samples/                     original sample source pages
```

## Security notes

The public app has no account system or database. The route sheds work above two concurrent model generations per server instance, but that is not distributed rate limiting. Before public launch, configure Vercel Firewall rate limits plus OpenAI project spend limits and alerts. Public deployment is blocked until those controls are verified.

The server requires a bounded request length, rejects unsupported or mismatched image types, caps images at 4 MB, and accepts exactly one source. Browser responses include a CSP and defensive headers. Source text is treated as untrusted content in both model prompts.

The final full and production-only `npm audit` runs reported zero vulnerabilities. See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for the reviewed controls, deployment blocker, and untested surfaces.

Active penetration testing is intentionally outside this project's verification plan. Security checks use static review, automated tests, dependency audits, and platform controls.

## License

The application code is available under the [MIT License](LICENSE). The six original sample pages are available under [CC BY 4.0](public/samples/LICENSE.md).
