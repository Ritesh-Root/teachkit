# Submission control sheet

Status on July 15, 2026: not ready to submit.

The local product is strong enough to continue, but the entry still lacks proof of a successful live GPT-5.6 run, a final judge-accessible live deployment, a public demo video, and the required `/feedback` Session ID. A fallback-only preview does not satisfy the GPT-5.6 requirement.

## Verified event facts

- Track: Education
- Submission deadline: July 21, 2026 at 5:00 PM Pacific Time, which is July 22 at 5:30 AM IST
- Required project: a working project built with Codex using GPT-5.6
- Required video: public YouTube, under three minutes, with audio explaining the product, Codex usage, and GPT-5.6 usage
- Required repository: public with a relevant license, or private and shared with `testing@devpost.com` and `build-week-event@openai.com`
- Required field: `/feedback` Session ID from the primary Codex build thread
- Required repository documentation: setup, sample data, testing guidance, Codex collaboration, GPT-5.6 integration, and major decisions
- Submission materials must be in English or include an English translation

The official rules and Devpost website remain the source of truth.

## API access and event credits

The event offers Codex credits. It does not provide an OpenAI API key or separate OpenAI API credits. TeachKit's live generation therefore needs an OpenAI API project, a server-side key, and enough project quota or billing for the demo and judging period.

Before any live request:

1. Create or select a dedicated OpenAI API project.
2. Configure a small project spend limit and alerts.
3. Create a project API key.
4. Store the key only in `.env.local` locally and in the deployment provider's encrypted environment settings.
5. Never paste the key into chat, commit it, or expose it through a `NEXT_PUBLIC_` variable.

## Submission gates

| Gate | Status | Evidence or owner action |
| --- | --- | --- |
| Education track | Ready | README and product scope consistently target teachers |
| Codex is central | Partial | Workflow and decisions are documented, but the work is not committed and `/feedback` is missing |
| GPT-5.6 is central | Partial | Two-call implementation and tests pass, but no live request has succeeded |
| Working local product | Ready for fallback demo | Image, sample, topic, streaming UI, fallback, and A4 print flow are implemented |
| Six original samples | Ready | Six SVG and PNG pairs are available under `public/samples/` |
| Repository URL | Blocked | Configure a Git remote, create reviewable commits, then publish or share the repository |
| Fallback-only preview | Ready to deploy | Must remain labeled and must not be presented as the final GPT-5.6 application |
| Final judge-accessible app | Blocked | Configure a Platform API key, edge rate limits, and OpenAI spend controls before the live deployment |
| Demo video | Blocked | Record and publish after the deployed live flow passes |
| `/feedback` Session ID | Blocked | Run `/feedback` in the primary build thread and copy the ID into Devpost |
| Consistency review | Blocked | Compare the final app, README, video, repository, and Devpost text after all URLs exist |

## Draft Devpost copy

Do not publish this final-state copy while the hosted project is fallback-only. A preview draft must say that live GPT-5.6 generation is disabled and that the URL demonstrates the interface, authored fallback, and print flow only.

### Tagline

Turn one textbook page into a printable lesson pack for three levels of learners.

### Description

TeachKit helps a teacher prepare differentiated classroom material from one source. The teacher photographs a textbook page, chooses one of six original samples, or types a topic. GPT-5.6 first identifies the topic, grade level, subject, source language, and essential concepts. A second GPT-5.6 request builds a structured lesson pack while the three worksheets appear on screen.

Every pack contains Guided Practice, Independent Practice, Challenge, a five-question exit quiz, discussion prompts, and a parent note. The three worksheets share one learning objective but change the amount of support and the type of thinking required. The finished pack prints as five A4 pages through the browser.

The app has no accounts or database. The API key and prompts stay on the server. Strict schemas validate both model stages, SDK retries are disabled to preserve the two-request contract, and failures switch to a clearly labeled authored demo pack.

Codex was used throughout the main build thread to inspect documentation, challenge the two-call architecture, implement the streaming pipeline and print renderer, compare Figma directions, add tests, and respond to independent code and security reviews. The repository records the resulting product and engineering decisions.

### Built with

Next.js, React, TypeScript, OpenAI Responses API, GPT-5.6, Zod, shadcn/ui, Tailwind CSS, Figma, and Codex.

## Demo video plan

Target length: 2 minutes 30 seconds.

1. `0:00-0:15`: State the teacher problem and show the six original source choices.
2. `0:15-0:55`: Select the water-cycle page and start one live generation. Show source analysis and all three worksheets arriving.
3. `0:55-1:20`: Compare Guided, Independent, and Challenge. Show the quiz, discussion prompts, and parent note.
4. `1:20-1:35`: Open the browser print dialog and show the A4 pack.
5. `1:35-2:10`: Show brief Codex build footage. Explain the two-call decision, strict schemas, streamed worksheet extraction, fallback, testing, and Figma iteration.
6. `2:10-2:30`: Explain that GPT-5.6 performs both source understanding and lesson-pack generation, then close on the teacher outcome.

The narration must explicitly say how Codex was used and what each GPT-5.6 request does. Do not use copyrighted music or third-party textbook scans.

Use [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md) for the timed narration and recording gates. Fallback-only footage is draft material and cannot be published as the final submission demo.

## Live validation record

Complete this section after the approved water-cycle run:

- Validation date and environment:
- Analysis request ID and latency:
- Analysis schema valid:
- Generation request ID and latency:
- Generation schema valid:
- Worksheet arrival times:
- Total time to complete:
- Fallback events observed:
- A4 PDF page count and SHA-256:
- Browser console result:

## Impact evidence to collect

Before submission, use [EVALUATION.md](EVALUATION.md) to ask three to five teachers to try one original sample and rate the pack on a 1-5 scale for correctness, useful differentiation, print readiness, and estimated preparation time saved. Record the number of teachers, the questions asked, aggregate scores, and any repeated criticism. Do not claim classroom impact or time savings that were not actually measured.

Minimum credible evidence for the entry:

- at least three completed evaluations
- one concrete change made because of teacher feedback
- the median estimated minutes saved, clearly labeled as a small-sample estimate
- no student personal data and no copyrighted textbook uploads in the study

## Consistency locks

- Describe the product as English-only until another language passes live generation and print review.
- Do not claim 50 or more languages in the app, video, README, or Devpost copy.
- Say exactly two GPT-5.6 requests on a successful run. The local fallback makes zero model requests.
- Keep fallback provenance visible in the video and printed output.
- Use only original TeachKit samples in the repository and demo.
- Do not describe a live model test as complete until this file contains the recorded evidence.

## Owner-only actions

- [ ] Request the event's Codex credits before the resources-page deadline if not already requested.
- [ ] Configure an OpenAI API project, spend limit, alert, billing or quota, and a server-side key.
- [ ] Run the approved live validation and complete the evidence record above.
- [ ] Configure Vercel Firewall rate limiting for `POST /api/lesson-pack`.
- [ ] Deploy and verify the production sample flow, headers, logs, fallback, and controlled `429` response.
- [ ] Create reviewable Git commits and publish or share the repository.
- [ ] Record and publish the narrated YouTube video.
- [ ] Run `/feedback` in the primary Codex thread.
- [ ] Fill every required Devpost field and make sure the entry is submitted rather than left as a draft.
