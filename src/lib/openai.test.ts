import { describe, expect, it, vi } from "vitest";

import { GOLDEN_ANALYSIS, GOLDEN_PACK } from "@/lib/golden-pack";
import { LessonPackSchema, SourceAnalysisSchema } from "@/lib/lesson-pack";
import {
  OPENAI_CLIENT_OPTIONS,
  runGptPipeline,
  TEACHKIT_MODEL,
  type ModelResponses,
  type PipelineEvent,
  type ValidationTraceEvent,
} from "@/lib/openai";

describe("TeachKit schemas", () => {
  it("accepts the authored golden analysis and lesson pack", () => {
    expect(SourceAnalysisSchema.safeParse(GOLDEN_ANALYSIS).success).toBe(true);
    expect(LessonPackSchema.safeParse(GOLDEN_PACK).success).toBe(true);
  });
});

describe("runGptPipeline", () => {
  it("disables SDK retries and bounds each OpenAI request", () => {
    expect(OPENAI_CLIENT_OPTIONS).toEqual({ maxRetries: 0, timeout: 40_000 });
  });

  it("uses exactly two model requests and streams all three worksheets", async () => {
    const calls: Array<{ method: string; body: Record<string, unknown> }> = [];
    const json = JSON.stringify(GOLDEN_PACK);
    const chunks = Array.from({ length: Math.ceil(json.length / 173) }, (_, index) =>
      json.slice(index * 173, (index + 1) * 173),
    );

    const responses: ModelResponses = {
      parse: vi.fn(async (body) => {
        calls.push({ method: "parse", body });
        return {
          id: "resp_analysis",
          _request_id: "req_analysis",
          output_parsed: GOLDEN_ANALYSIS,
        };
      }),
      stream: vi.fn((body) => {
        calls.push({ method: "stream", body });
        return {
          async *[Symbol.asyncIterator]() {
            for (const delta of chunks) {
              yield { type: "response.output_text.delta", delta };
            }
          },
          finalResponse: vi.fn(async () => ({
            id: "resp_generation",
            _request_id: "req_generation",
            output_parsed: GOLDEN_PACK,
          })),
        };
      }),
    };
    const events: PipelineEvent[] = [];
    const validationTrace: ValidationTraceEvent[] = [];

    const result = await runGptPipeline({
      source: { sourceMode: "topic", topic: "The water cycle for Grade 4" },
      outputLanguage: "English",
      responses,
      onEvent: (event) => {
        events.push(event);
      },
      onValidationTrace: (event) => {
        validationTrace.push(event);
      },
    });

    expect(result).toEqual(GOLDEN_PACK);
    expect(calls.map((call) => call.method)).toEqual(["parse", "stream"]);
    expect(calls.every((call) => call.body.model === TEACHKIT_MODEL)).toBe(true);
    expect(events.filter((event) => event.type === "worksheet")).toHaveLength(3);
    expect(events.at(0)?.type).toBe("analysis");
    const analysisEvent = events.find(
      (event): event is Extract<PipelineEvent, { type: "analysis" }> => event.type === "analysis",
    );
    expect(analysisEvent?.data.sourceMode).toBe("topic");
    expect(events.at(-1)?.type).toBe("complete");
    expect(
      validationTrace.map(({ event, slot, model, elapsedMs, requestId }) => ({
        event,
        slot,
        model,
        ...(typeof elapsedMs === "number" ? { elapsedMs: expect.any(Number) } : {}),
        ...(requestId ? { requestId } : {}),
      })),
    ).toEqual([
      { event: "model_call_start", slot: "analysis", model: TEACHKIT_MODEL },
      {
        event: "model_call_complete",
        slot: "analysis",
        model: TEACHKIT_MODEL,
        elapsedMs: expect.any(Number),
        requestId: "req_analysis",
      },
      { event: "schema_valid", slot: "analysis", model: TEACHKIT_MODEL },
      { event: "model_call_start", slot: "generation", model: TEACHKIT_MODEL },
      {
        event: "model_call_complete",
        slot: "generation",
        model: TEACHKIT_MODEL,
        elapsedMs: expect.any(Number),
        requestId: "req_generation",
      },
      { event: "schema_valid", slot: "generation", model: TEACHKIT_MODEL },
    ]);
    expect(
      validationTrace
        .filter((event) => event.event === "model_call_complete")
        .every((event) => typeof event.elapsedMs === "number" && event.elapsedMs >= 0),
    ).toBe(true);
    expect(
      validationTrace.every((event) =>
        Object.keys(event).every((key) =>
          ["event", "slot", "model", "elapsedMs", "requestId"].includes(key),
        ),
      ),
    ).toBe(true);
  });

  it("does not let validation tracing change pipeline behavior", async () => {
    const responses: ModelResponses = {
      parse: vi.fn(async () => ({ output_parsed: GOLDEN_ANALYSIS })),
      stream: vi.fn(() => ({
        async *[Symbol.asyncIterator]() {
          yield { type: "response.output_text.delta", delta: JSON.stringify(GOLDEN_PACK) };
        },
        finalResponse: vi.fn(async () => ({ output_parsed: GOLDEN_PACK })),
      })),
    };

    await expect(
      runGptPipeline({
        source: { sourceMode: "topic", topic: "The water cycle" },
        outputLanguage: "English",
        responses,
        onEvent: () => undefined,
        onValidationTrace: () => {
          throw new Error("logging unavailable");
        },
      }),
    ).resolves.toEqual(GOLDEN_PACK);
  });

  it("does not retry when the second response is invalid", async () => {
    let calls = 0;
    const responses: ModelResponses = {
      parse: vi.fn(async () => {
        calls += 1;
        return { output_parsed: GOLDEN_ANALYSIS };
      }),
      stream: vi.fn(() => {
        calls += 1;
        return {
          async *[Symbol.asyncIterator]() {
            yield { type: "response.output_text.delta", delta: "{}" };
          },
          finalResponse: vi.fn(async () => ({ output_parsed: null })),
        };
      }),
    };

    await expect(
      runGptPipeline({
        source: { sourceMode: "topic", topic: "Fractions" },
        outputLanguage: "English",
        responses,
        onEvent: () => undefined,
      }),
    ).rejects.toThrow("required schema");
    expect(calls).toBe(2);
  });
});
