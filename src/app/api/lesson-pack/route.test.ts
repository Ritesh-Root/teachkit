import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ runGptPipeline: vi.fn() }));

vi.mock("@/lib/openai", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/openai")>();
  return { ...original, runGptPipeline: mocks.runGptPipeline };
});

import { POST } from "@/app/api/lesson-pack/route";

describe("POST /api/lesson-pack", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalValidationTrace = process.env.TEACHKIT_VALIDATION_TRACE;

  afterEach(() => {
    mocks.runGptPipeline.mockReset();
    vi.restoreAllMocks();
    if (originalApiKey) process.env.OPENAI_API_KEY = originalApiKey;
    else delete process.env.OPENAI_API_KEY;
    if (originalValidationTrace) process.env.TEACHKIT_VALIDATION_TRACE = originalValidationTrace;
    else delete process.env.TEACHKIT_VALIDATION_TRACE;
  });

  it("rejects multiple sources before making a model request", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const formData = new FormData();
    formData.set("topic", "Fractions");
    formData.set("image", new File(["image"], "sample.png", { type: "image/png" }));

    const response = await POST(
      lessonPackRequest(formData),
    );

    expect(response.status).toBe(400);
    expect(mocks.runGptPipeline).not.toHaveBeenCalled();
  });

  it("returns an explicitly labeled golden fallback when no API key is configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const formData = new FormData();
    formData.set("image", pngFile());
    formData.set("outputLanguage", "English");

    const response = await POST(
      lessonPackRequest(formData),
    );
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string });

    expect(response.status).toBe(200);
    expect(events.map((event) => event.type)).toEqual([
      "fallback",
      "analysis",
      "worksheet",
      "worksheet",
      "worksheet",
      "complete",
    ]);
    expect(mocks.runGptPipeline).not.toHaveBeenCalled();
  });

  it("rejects a declared image type when the file signature does not match", async () => {
    delete process.env.OPENAI_API_KEY;
    const formData = new FormData();
    formData.set("image", new File(["not a png"], "sample.png", { type: "image/png" }));

    const response = await POST(lessonPackRequest(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The file contents do not match the selected image type.",
    });
  });

  it("sheds model work above the per-instance concurrency ceiling", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const release: Array<() => void> = [];
    mocks.runGptPipeline.mockImplementation(
      () => new Promise((resolve) => release.push(() => resolve(undefined))),
    );

    const first = await POST(topicRequest("Fractions for Grade 4"));
    const second = await POST(topicRequest("Plant life cycles"));
    const third = await POST(topicRequest("Simple machines"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers.get("retry-after")).toBe("10");

    release.forEach((finish) => finish());
    await Promise.all([first.text(), second.text()]);
  });

  it("keeps live validation tracing disabled by default", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.TEACHKIT_VALIDATION_TRACE;
    mocks.runGptPipeline.mockResolvedValue(undefined);
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(topicRequest("Fractions for Grade 4"));
    await response.text();

    expect(mocks.runGptPipeline).toHaveBeenCalledOnce();
    expect(mocks.runGptPipeline.mock.calls[0]?.[0].onValidationTrace).toBeUndefined();
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it.each(["true", "01"])(
    "keeps live validation tracing disabled for non-exact value %s",
    async (traceValue) => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.TEACHKIT_VALIDATION_TRACE = traceValue;
      mocks.runGptPipeline.mockResolvedValue(undefined);
      const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

      const response = await POST(topicRequest("Fractions for Grade 4"));
      await response.text();

      expect(mocks.runGptPipeline).toHaveBeenCalledOnce();
      expect(mocks.runGptPipeline.mock.calls[0]?.[0].onValidationTrace).toBeUndefined();
      expect(consoleInfo).not.toHaveBeenCalled();
    },
  );

  it("logs only the safe trace payload when explicitly enabled", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.TEACHKIT_VALIDATION_TRACE = "1";
    mocks.runGptPipeline.mockImplementation(async ({ onValidationTrace }) => {
      onValidationTrace?.({
        event: "model_call_complete",
        slot: "analysis",
        model: "gpt-5.6",
        elapsedMs: 123,
        requestId: "req_test",
      });
    });
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(topicRequest("Fractions for Grade 4"));
    await response.text();

    expect(consoleInfo).toHaveBeenCalledOnce();
    const log = String(consoleInfo.mock.calls[0]?.[0]);
    expect(log).toContain("[teachkit-live-validation]");
    expect(log).toContain('"requestId":"req_test"');
    expect(log).not.toContain("test-key");
    expect(log).not.toContain("Fractions for Grade 4");
  });
});

function lessonPackRequest(formData: FormData) {
  return new Request("http://localhost/api/lesson-pack", {
    method: "POST",
    body: formData,
    headers: { "content-length": "1024" },
  });
}

function topicRequest(topic: string) {
  const formData = new FormData();
  formData.set("topic", topic);
  formData.set("outputLanguage", "English");
  return lessonPackRequest(formData);
}

function pngFile() {
  return new File(
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    "sample.png",
    { type: "image/png" },
  );
}
