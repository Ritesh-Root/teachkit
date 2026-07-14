import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { extractCompleteArrayObjects } from "@/lib/incremental-json";
import {
  ChallengeWorksheetSchema,
  GuidedWorksheetSchema,
  IndependentWorksheetSchema,
  LessonPackSchema,
  SourceAnalysisSchema,
  type LessonPack,
  type SourceAnalysis,
  type Worksheet,
} from "@/lib/lesson-pack";
import {
  ANALYZE_SOURCE_INSTRUCTIONS,
  buildLessonPackInput,
  buildLessonPackInstructions,
} from "@/lib/prompts";

export const TEACHKIT_MODEL = "gpt-5.6";
export const OPENAI_CLIENT_OPTIONS = {
  maxRetries: 0,
  timeout: 40_000,
} as const;

export type PipelineEvent =
  | { type: "analysis"; data: SourceAnalysis }
  | { type: "worksheet"; index: number; data: Worksheet }
  | { type: "complete"; data: LessonPack };

export interface SourcePayload {
  sourceMode: "image" | "topic";
  topic?: string;
  imageDataUrl?: string;
}

interface ModelStreamEvent {
  type: string;
  delta?: string;
}

interface ParsedModelResponse {
  output_parsed: unknown;
  id?: string;
  _request_id?: string;
}

interface ModelStream extends AsyncIterable<ModelStreamEvent> {
  finalResponse(): Promise<ParsedModelResponse>;
}

export interface ModelResponses {
  parse(
    body: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ): Promise<ParsedModelResponse>;
  stream(body: Record<string, unknown>, options?: { signal?: AbortSignal }): ModelStream;
}

export interface ValidationTraceEvent {
  event: "model_call_start" | "model_call_complete" | "schema_valid";
  slot: "analysis" | "generation";
  model: typeof TEACHKIT_MODEL;
  elapsedMs?: number;
  requestId?: string;
}

interface RunPipelineOptions {
  source: SourcePayload;
  outputLanguage: string;
  safetyIdentifier?: string;
  signal?: AbortSignal;
  onEvent: (event: PipelineEvent) => void | Promise<void>;
  onValidationTrace?: (event: ValidationTraceEvent) => void;
  responses?: ModelResponses;
}

class TwoCallBudget {
  private readonly used = new Set<"analysis" | "generation">();

  consume(slot: "analysis" | "generation") {
    if (this.used.has(slot)) throw new Error(`Model call slot already consumed: ${slot}`);
    this.used.add(slot);
  }

  assertComplete() {
    if (this.used.size !== 2) {
      throw new Error(`Expected exactly two model calls, received ${this.used.size}`);
    }
  }
}

export async function runGptPipeline({
  source,
  outputLanguage,
  safetyIdentifier,
  signal,
  onEvent,
  onValidationTrace,
  responses = createResponsesClient(),
}: RunPipelineOptions): Promise<LessonPack> {
  const budget = new TwoCallBudget();
  const requestIdentity = safetyIdentifier ? { safety_identifier: safetyIdentifier } : {};

  budget.consume("analysis");
  const analysisStartedAt = performance.now();
  emitValidationTrace(onValidationTrace, {
    event: "model_call_start",
    slot: "analysis",
    model: TEACHKIT_MODEL,
  });
  const analysisResponse = await responses.parse(
    {
      model: TEACHKIT_MODEL,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 700,
      instructions: ANALYZE_SOURCE_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content:
            source.sourceMode === "image"
              ? [
                  {
                    type: "input_text",
                    text: "Analyze this textbook page as educational source material.",
                  },
                  {
                    type: "input_image",
                    detail: "original",
                    image_url: source.imageDataUrl,
                  },
                ]
              : [
                  {
                    type: "input_text",
                    text: `Analyze this teacher-provided lesson topic: ${source.topic}`,
                  },
                ],
        },
      ],
      text: { format: zodTextFormat(SourceAnalysisSchema, "source_analysis") },
      ...requestIdentity,
    },
    { signal },
  );
  emitValidationTrace(onValidationTrace, {
    event: "model_call_complete",
    slot: "analysis",
    model: TEACHKIT_MODEL,
    elapsedMs: Math.round(performance.now() - analysisStartedAt),
    ...getRequestTraceId(analysisResponse),
  });

  const parsedAnalysis = SourceAnalysisSchema.safeParse(analysisResponse.output_parsed);
  if (!parsedAnalysis.success) throw new Error("Source analysis did not match the required schema.");
  emitValidationTrace(onValidationTrace, {
    event: "schema_valid",
    slot: "analysis",
    model: TEACHKIT_MODEL,
  });
  const analysis = { ...parsedAnalysis.data, sourceMode: source.sourceMode };
  await onEvent({ type: "analysis", data: analysis });

  budget.consume("generation");
  const generationStartedAt = performance.now();
  emitValidationTrace(onValidationTrace, {
    event: "model_call_start",
    slot: "generation",
    model: TEACHKIT_MODEL,
  });
  const stream = responses.stream(
    {
      model: TEACHKIT_MODEL,
      store: false,
      reasoning: { effort: "medium" },
      max_output_tokens: 7_000,
      instructions: buildLessonPackInstructions(outputLanguage),
      input: buildLessonPackInput(analysis, outputLanguage),
      text: { format: zodTextFormat(LessonPackSchema, "lesson_pack") },
      ...requestIdentity,
    },
    { signal },
  );

  const worksheetSchemas = [
    GuidedWorksheetSchema,
    IndependentWorksheetSchema,
    ChallengeWorksheetSchema,
  ] as const;
  let buffer = "";
  let emittedWorksheets = 0;

  for await (const event of stream) {
    if (event.type !== "response.output_text.delta" || !event.delta) continue;
    buffer += event.delta;

    const candidates = extractCompleteArrayObjects(buffer, "worksheets");
    while (emittedWorksheets < Math.min(candidates.length, worksheetSchemas.length)) {
      const result = worksheetSchemas[emittedWorksheets].safeParse(candidates[emittedWorksheets]);
      if (!result.success) break;
      await onEvent({ type: "worksheet", index: emittedWorksheets, data: result.data });
      emittedWorksheets += 1;
    }
  }

  const finalResponse = await stream.finalResponse();
  emitValidationTrace(onValidationTrace, {
    event: "model_call_complete",
    slot: "generation",
    model: TEACHKIT_MODEL,
    elapsedMs: Math.round(performance.now() - generationStartedAt),
    ...getRequestTraceId(finalResponse),
  });
  const parsedPack = LessonPackSchema.safeParse(finalResponse.output_parsed);
  if (!parsedPack.success) throw new Error("Lesson pack did not match the required schema.");
  emitValidationTrace(onValidationTrace, {
    event: "schema_valid",
    slot: "generation",
    model: TEACHKIT_MODEL,
  });

  while (emittedWorksheets < parsedPack.data.worksheets.length) {
    await onEvent({
      type: "worksheet",
      index: emittedWorksheets,
      data: parsedPack.data.worksheets[emittedWorksheets],
    });
    emittedWorksheets += 1;
  }

  budget.assertComplete();
  await onEvent({ type: "complete", data: parsedPack.data });
  return parsedPack.data;
}

function emitValidationTrace(
  callback: RunPipelineOptions["onValidationTrace"],
  event: ValidationTraceEvent,
) {
  try {
    callback?.(event);
  } catch {
    // Validation-only observability must never change generation behavior.
  }
}

function getRequestTraceId(response: ParsedModelResponse) {
  return {
    ...(response._request_id ? { requestId: response._request_id } : {}),
  };
}

function createResponsesClient(): ModelResponses {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const client = new OpenAI({ apiKey, ...OPENAI_CLIENT_OPTIONS });
  return client.responses as unknown as ModelResponses;
}
