import { describe, expect, it } from "vitest";

import { extractCompleteArrayObjects } from "@/lib/incremental-json";

describe("extractCompleteArrayObjects", () => {
  it("returns only fully closed objects from a partial streamed array", () => {
    const partial =
      '{"worksheets":[{"title":"Guided","nested":{"text":"brace } and \\\"quote\\\""}},{"title":"Independent"';

    expect(extractCompleteArrayObjects(partial, "worksheets")).toEqual([
      { title: "Guided", nested: { text: 'brace } and "quote"' } },
    ]);
  });

  it("handles nested arrays and returns all completed items", () => {
    const complete = JSON.stringify({
      worksheets: [
        { title: "Guided", questions: [{ prompt: "One" }] },
        { title: "Independent", questions: [{ prompt: "Two" }] },
        { title: "Challenge", questions: [{ prompt: "Three" }] },
      ],
    });

    expect(extractCompleteArrayObjects(complete, "worksheets")).toHaveLength(3);
  });
});
