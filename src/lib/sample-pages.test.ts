import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SAMPLE_PAGES } from "@/lib/sample-pages";

describe("TeachKit sample pages", () => {
  it("ships six varied, original demo sources", () => {
    expect(SAMPLE_PAGES).toHaveLength(6);
    expect(new Set(SAMPLE_PAGES.map((sample) => sample.id)).size).toBe(6);
    expect(new Set(SAMPLE_PAGES.map((sample) => sample.subject)).size).toBeGreaterThanOrEqual(4);
  });

  it.each(SAMPLE_PAGES)("ships PNG and SVG assets for $id", (sample) => {
    const assetRoot = join(process.cwd(), "public", "samples");
    expect(existsSync(join(assetRoot, `${sample.id}.png`))).toBe(true);
    expect(existsSync(join(assetRoot, `${sample.id}.svg`))).toBe(true);
  });
});
