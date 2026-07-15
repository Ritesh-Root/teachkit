# TeachKit preview presentation video

This is a polished preview video, not the final hackathon submission video. It keeps the public-preview limitation visible and does not claim that GPT-5.6 ran in the deployed site. Replace it only after one verified live GPT-5.6 run has been recorded.

## Narration

Teachers often begin with one source page, thirty different learners, and almost no preparation time. TeachKit is built around that reality.

It starts with the material a teacher already has. They can choose a photographed page, a supplied sample, or type a topic. The goal is simple: turn that starting point into a complete, printable lesson pack.

The product follows a focused flow. Choose a source. Map the learning context. Assemble differentiated materials. Then print five clean A4 pages directly from the browser.

The same learning objective becomes three distinct worksheets. Guided Practice includes vocabulary, a worked example, and hints. Independent Practice removes those supports. Challenge asks learners to transfer the idea and explain their reasoning.

The public deployment shown here is a clearly labeled authored fallback preview. It demonstrates the interface and print flow. It does not send the selected page to OpenAI or represent this sample pack as live model output.

The guarded live architecture is designed around two GPT-5.6 stages. The first reads a source into a strict schema with the topic, grade estimate, language, and key concepts. The second builds the complete structured pack and streams validated worksheet sections. That live path remains disabled until a dedicated API budget and distributed rate limits are in place.

Codex was part of the build. I used one primary Codex thread to implement the request state machine, strict schemas, streaming behavior, and browser print layout. Codex also helped test desktop and mobile states, compare Figma directions, and document the architecture and security decisions.

TeachKit is a focused workflow for a familiar teacher problem: turning one source into useful work for more kinds of learners.

## Required disclosure

The local voiceover is AI-generated with an offline synthetic voice. The YouTube description must disclose that if this audio is used.

## Final-video replacement gate

Before using the final submission video, replace the preview disclaimer segment with one real, recorded GPT-5.6 run. Keep the explanation of both model stages and Codex use in the final narration.
