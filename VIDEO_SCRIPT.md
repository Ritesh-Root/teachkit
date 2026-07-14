# Demo video script

Target length: 2 minutes 20 seconds. The final recording must show one successful live GPT-5.6 run. The fallback-only preview can supply interface and print B-roll, but it cannot replace the live segment.

## Recording gates

- Public deployment uses GPT-5.6 and passes the two-request validation.
- The selected source and generated pack match.
- The print preview remains five readable A4 pages.
- The browser console has no errors.
- Codex build footage contains no secrets, private notifications, or unrelated repositories.
- Narration states how Codex was used and what both GPT-5.6 requests do.
- Any generated voice is disclosed as AI-generated in the YouTube description.

## Timed shot list and narration

### 0:00 to 0:15

Shot: Show the six original sample pages, then select the water cycle.

Narration:

> A teacher often has one source page, thirty students at different levels, and almost no preparation time. TeachKit turns that page into a differentiated lesson pack that is ready to print.

### 0:15 to 0:50

Shot: Start the validated live run. Keep the source analysis and worksheet arrival states visible.

Narration:

> GPT-5.6 first reads the page and returns the topic, grade, subject, source language, and essential concepts in a strict schema. A second GPT-5.6 request generates the full pack. TeachKit streams each completed worksheet as soon as it passes validation.

### 0:50 to 1:15

Shot: Compare Guided Practice, Independent Practice, and Challenge.

Narration:

> The three worksheets share one objective, but the support changes. Guided Practice includes vocabulary, a worked example, and hints. Independent Practice removes that support. Challenge asks students to transfer the idea and justify their reasoning.

### 1:15 to 1:35

Shot: Show the exit quiz, discussion prompts, parent note, and browser print preview.

Narration:

> The same run also creates a five-question exit quiz, discussion prompts, and a parent note. Browser print styles turn the result into five A4 pages without a PDF service.

### 1:35 to 2:05

Shot: Show short Codex build footage, tests, the two-call code path, and the selected Figma frame.

Narration:

> I built TeachKit in one primary Codex thread. Codex helped me test the exactly-two-request contract, implement strict schemas and incremental streaming, inspect desktop and mobile states, compare Figma directions, and respond to independent architecture and security reviews. I kept the final product decisions in the repository instead of hiding them in a chat transcript.

### 2:05 to 2:20

Shot: Return to the printed pack and the TeachKit title.

Narration:

> TeachKit does one focused job: turn the material a teacher already has into useful work for more than one kind of learner.

## Preview-only recording note

Until the live API validation exists, any recording must retain the yellow preview banner and the on-screen fallback notice. Do not edit those labels out or narrate the authored pack as model output.

The local preview draft is stored at `output/video/teachkit-preview-draft.mp4`. It is 51 seconds long, uses an offline synthetic voice, and states that live GPT-5.6 is disabled. This file is B-roll only and is intentionally ignored by Git.
