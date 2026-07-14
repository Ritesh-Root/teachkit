# Security review

Reviewed on July 15, 2026 after the first complete English workflow, the Editorial Lesson Studio frontend, and the six-sample source selector.

## Gate result

Local application gate: pass.

Fallback-only preview gate: pass. The deployed preview has no OpenAI key, labels its state, and does not send the selected source to OpenAI.

Live deployment gate: blocked until distributed rate limits and OpenAI project spend limits and alerts are configured and verified. Vercel Firewall custom rules are unavailable on the current plan. The in-process ceiling protects one server instance, not the whole deployment.

## Controls verified

- The OpenAI key is server-only and no real secret is present in the repository.
- Successful generation has two logical calls and SDK transport retries are disabled.
- Both calls use `store: false`, bounded output, and a 45-second whole-pipeline deadline.
- Requests require a bounded content length. Images are capped at 4 MB and checked by declared type and file signature.
- The route accepts one source, validates model output with strict schemas, and treats source material as untrusted.
- React renders model text without raw HTML.
- The fallback is labeled on screen and in printed output.
- Fallback-mode progress UI describes the content as an authored demo pack rather than live GPT analysis.
- The source card discloses the random browser identifier used for abuse prevention; the server hashes it before forwarding it as a safety identifier.
- The source card tells users to upload only material they may use, explains OpenAI processing and possible abuse-monitoring retention, and states that TeachKit does not intentionally store uploads.
- The six original sample sources have a dedicated CC BY 4.0 license and attribution record.
- Document responses include CSP, frame, referrer, MIME, and permissions headers.
- Full and production-only dependency audits report zero vulnerabilities.
- Live-validation logs are disabled by default and contain only the run ID, call slot, elapsed time, upstream request ID, and schema-valid state. They exclude prompts, images, model output, API keys, and safety identifiers.
- Validation logging cannot change generation behavior if its callback fails.
- Lint, typecheck, 22 tests, production build, browser fallback flow, and five-page A4 rendering pass.
- An independent post-change static review found no new critical, high, or medium issues in the sample selector, privacy copy, fallback, or asset paths.

## Not tested yet

- A live GPT-5.6 image or topic request
- Distributed rate-limit behavior and the final live deployment
- OpenAI project spend limits and alerts
- Load, malformed multipart, disconnect, and platform-timeout testing
- Active exploit testing (intentionally outside the project verification plan)

Static review, automated tests, and dependency audits pass. The fallback-only preview is safe to share as a preview. Live deployment controls remain required security gates.

## Residual risks

- A public unauthenticated model endpoint can be abused without edge rate limits.
- The in-process concurrency counter is per server instance, origin-less clients can call the route, and the client-provided safety identifier is rotatable. Edge enforcement and OpenAI spend controls are therefore release blockers.
- Pipeline failures fall back silently without privacy-safe operational metrics, which makes abuse and upstream failures harder to distinguish.
- Uploaded image bytes are forwarded without metadata stripping; photographs may contain EXIF location, device, or timestamp data.
- The CSP permits inline scripts. React's escaped text rendering currently limits XSS exposure, but a nonce-based production CSP would be stronger.
- Textbook photos may contain personal or copyrighted material. TeachKit warns users not to upload student information and does not intentionally persist request contents.
- Model grade inference and generated teaching material can be wrong. Teachers must review a pack before using it.
