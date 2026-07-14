import { createHash, randomUUID } from "node:crypto";

import { GOLDEN_ANALYSIS, GOLDEN_PACK } from "@/lib/golden-pack";
import { runGptPipeline, type PipelineEvent, type SourcePayload } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const MODEL_DEADLINE_MS = 45_000;
const MAX_CONCURRENT_GENERATIONS = 2;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
let activeGenerations = 0;

type StreamEvent =
  | PipelineEvent
  | { type: "fallback"; message: string };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  const contentLength = request.headers.get("content-length");
  const declaredLength = Number(contentLength);
  if (!contentLength || !Number.isFinite(declaredLength) || declaredLength <= 0) {
    return Response.json({ error: "A valid Content-Length header is required." }, { status: 411 });
  }
  if (declaredLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  let input: Awaited<ReturnType<typeof parseInput>>;
  try {
    input = await parseInput(await request.formData());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid lesson-pack request." },
      { status: 400 },
    );
  }

  const usesModel = Boolean(process.env.OPENAI_API_KEY);
  if (usesModel && activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return Response.json(
      { error: "TeachKit is busy building other lesson packs. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "10" } },
    );
  }
  if (usesModel) activeGenerations += 1;

  const encoder = new TextEncoder();
  const upstreamController = new AbortController();
  const upstreamSignal = AbortSignal.any([
    request.signal,
    upstreamController.signal,
    AbortSignal.timeout(MODEL_DEADLINE_MS),
  ]);
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        if (!request.signal.aborted && !cancelled) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      };

      try {
        if (!process.env.OPENAI_API_KEY) {
          send({
            type: "fallback",
            message:
              "Demo fallback shown because the server has no OpenAI API key. This pack is not based on the submitted source.",
          });
          sendGoldenPack(send);
        } else {
          const validationRunId = process.env.TEACHKIT_VALIDATION_TRACE === "1" ? randomUUID() : null;
          await runGptPipeline({
            source: input.source,
            outputLanguage: input.outputLanguage,
            safetyIdentifier: input.safetyIdentifier,
            signal: upstreamSignal,
            onEvent: send,
            onValidationTrace: validationRunId
              ? (event) => {
                  console.info(
                    `[teachkit-live-validation] ${JSON.stringify({ runId: validationRunId, ...event })}`,
                  );
                }
              : undefined,
          });
        }
      } catch {
        if (!request.signal.aborted && !cancelled) {
          send({
            type: "fallback",
            message:
              "Demo fallback shown because generation could not finish. This pack is not based on the submitted source.",
          });
          sendGoldenPack(send);
        }
      } finally {
        if (usesModel) activeGenerations -= 1;
        if (!request.signal.aborted && !cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      upstreamController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function parseInput(formData: FormData) {
  const topic = getString(formData, "topic").trim();
  const outputLanguage = getString(formData, "outputLanguage") || "English";
  const clientId = getString(formData, "clientId");
  const fileValue = formData.get("image");
  const image = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (outputLanguage !== "English") {
    throw new Error("Only English output is enabled in this checkpoint.");
  }

  const sourceCount = Number(Boolean(topic)) + Number(Boolean(image));
  if (sourceCount !== 1) throw new Error("Provide exactly one image or topic.");

  let source: SourcePayload;
  if (topic) {
    if (topic.length < 3 || topic.length > 240) {
      throw new Error("Topic must be between 3 and 240 characters.");
    }
    source = { sourceMode: "topic", topic };
  } else {
    if (!image || !ALLOWED_IMAGE_TYPES.has(image.type)) {
      throw new Error("Choose a JPEG, PNG, or WebP image.");
    }
    if (image.size > MAX_IMAGE_BYTES) throw new Error("Image must be 4 MB or smaller.");
    const bytes = Buffer.from(await image.arrayBuffer());
    if (!hasValidImageSignature(bytes, image.type)) {
      throw new Error("The file contents do not match the selected image type.");
    }
    source = {
      sourceMode: "image",
      imageDataUrl: `data:${image.type};base64,${bytes.toString("base64")}`,
    };
  }

  return {
    source,
    outputLanguage,
    safetyIdentifier: clientId ? hashIdentifier(clientId) : undefined,
  };
}

function hasValidImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function sendGoldenPack(send: (event: StreamEvent) => void) {
  send({ type: "analysis", data: GOLDEN_ANALYSIS });
  GOLDEN_PACK.worksheets.forEach((worksheet, index) => {
    send({ type: "worksheet", index, data: worksheet });
  });
  send({ type: "complete", data: GOLDEN_PACK });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier.slice(0, 128)).digest("hex");
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
