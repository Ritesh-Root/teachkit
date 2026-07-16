# TeachKit simulated interactive walkthrough

**Status:** This is a transparent simulated walkthrough for internal review. It is not the final OpenAI Build Week submission video. Every illustrative lesson pack shown in the video must retain the on-screen label: `SIMULATED LESSON-PACK WALKTHROUGH. ILLUSTRATIVE OUTPUT, NOT A LIVE GPT-5.6 RUN.`

## Narration

A teacher has a textbook page, a mixed-level classroom, and very little time to prepare. TeachKit turns that starting point into a lesson pack that is ready to print.

Here, a Year 5 science page about the water cycle is selected. The source stays familiar to the teacher. The work moves from one page into a lesson plan, three levels of practice, a short exit quiz, discussion prompts, and a note for home.

The important part is the difference between the worksheets. Guided Practice gives learners vocabulary, a worked example, and hints. Independent Practice removes those supports. Challenge asks students to apply the same idea and explain their reasoning.

This is where TeachKit is useful. A teacher can keep one learning objective while giving students a route into the material that matches where they are today. The pack is built for the classroom, then printed as clean A4 pages from the browser.

The live architecture is designed around two GPT-5.6 stages. First, the source page is read into a strict lesson schema. Then the lesson pack is generated as structured sections that assemble in the interface. The live path will only appear in the final submission video after a verified request is recorded.

Codex helped build the product around that flow. I used it to implement the request state, the schemas, the streaming lesson-pack experience, and the print layout. It also helped turn design directions into a focused single-page teacher workflow.

TeachKit is for the moment when a teacher needs to turn one source into useful work for more of the students in the room.

## On-screen text sequence

1. `TeachKit` / `Turn one textbook page into a differentiated, printable lesson pack.`
2. Persistent lower-third from the first example onwards: `SIMULATED LESSON-PACK WALKTHROUGH. ILLUSTRATIVE OUTPUT, NOT A LIVE GPT-5.6 RUN.`
3. Source card: `Water cycle | Year 5 science | English`
4. `Guided Practice` / `Vocabulary + worked example + hints`
5. `Independent Practice` / `Same objective. Fewer supports.`
6. `Challenge` / `Apply the idea. Explain the reasoning.`
7. `Print-ready A4 pages`
8. `Two GPT-5.6 stages: source analysis, then structured lesson-pack generation.`
9. `Built with Codex: request flow, schemas, streaming UI, print layout.`
10. `TeachKit | One source. More ways in.`

## Compliance checks

- Do not call the illustrative pack a live result.
- Do not say that the deployed site made an OpenAI request.
- Do not remove, crop, fade, or obscure the persistent simulation label during illustrative outputs.
- Keep the duration below three minutes.
- If Deepgram audio is used, disclose AI-generated narration in the YouTube description.
