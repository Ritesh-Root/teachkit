"use client";

import Image from "next/image";
import { type DragEvent, type RefObject, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  Check,
  FileText,
  ImagePlus,
  Languages,
  LoaderCircle,
  Printer,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { LessonPackView } from "@/components/lesson-pack";
import { Button } from "@/components/ui/button";
import type {
  LessonPack,
  SourceAnalysis,
  SourceMode,
  Worksheet,
} from "@/lib/lesson-pack";
import {
  LessonPackSchema,
  SourceAnalysisSchema,
  WorksheetSchema,
} from "@/lib/lesson-pack";
import { SAMPLE_PAGES } from "@/lib/sample-pages";
import { cn } from "@/lib/utils";

type Phase = "ready" | "analyzing" | "building" | "complete";

type ClientStreamEvent =
  | { type: "fallback"; message: string }
  | { type: "analysis"; data: SourceAnalysis }
  | { type: "worksheet"; index: number; data: Worksheet }
  | { type: "complete"; data: LessonPack };

const ClientStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("fallback"), message: z.string().min(1).max(500) }).strict(),
  z.object({ type: z.literal("analysis"), data: SourceAnalysisSchema }).strict(),
  z
    .object({ type: z.literal("worksheet"), index: z.number().int().min(0).max(2), data: WorksheetSchema })
    .strict(),
  z.object({ type: z.literal("complete"), data: LessonPackSchema }).strict(),
]);

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const DEFAULT_SAMPLE_ID = SAMPLE_PAGES[0].id;

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function TeachKitApp({ liveGenerationEnabled }: { liveGenerationEnabled: boolean }) {
  const [mode, setMode] = useState<SourceMode>("image");
  const [phase, setPhase] = useState<Phase>("ready");
  const [topic, setTopic] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(DEFAULT_SAMPLE_ID);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SourceAnalysis | null>(null);
  const [pack, setPack] = useState<LessonPack | null>(null);
  const [streamedWorksheets, setStreamedWorksheets] = useState<Worksheet[]>([]);
  const [visibleSections, setVisibleSections] = useState(0);
  const runId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const selectedSample = SAMPLE_PAGES.find((sample) => sample.id === selectedSampleId) ?? null;

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (phase !== "analyzing" && phase !== "complete") return;
    window.requestAnimationFrame(() => statusHeading.current?.focus({ preventScroll: true }));
  }, [phase]);

  const canGenerate =
    mode === "image" ? Boolean(selectedSample) || Boolean(selectedFile) : topic.trim().length >= 3;
  const isWorking = phase === "analyzing" || phase === "building";

  function chooseMode(nextMode: SourceMode) {
    if (isWorking) return;
    setMode(nextMode);
    setError(null);
    if (nextMode === "topic") setSelectedSampleId(null);
  }

  function handleFile(file?: File) {
    if (!file) return;
    setError(null);

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      clearSelectedUpload();
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      clearSelectedUpload();
      setError("That image is larger than 4 MB. Choose a smaller photo.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setFileName(file.name);
    setSelectedSampleId(null);
  }

  function clearSelectedUpload() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setSelectedFile(null);
    setFileName(null);
    setSelectedSampleId(null);
  }

  function chooseSample(sampleId: string) {
    if (isWorking) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedSampleId(sampleId);
    setImagePreview(null);
    setSelectedFile(null);
    setFileName(null);
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (isWorking) return;
    handleFile(event.dataTransfer.files[0]);
  }

  async function generateDemoPack() {
    if (!canGenerate || isWorking) return;

    const currentRun = ++runId.current;
    activeRequest.current?.abort();
    const requestController = new AbortController();
    activeRequest.current = requestController;
    setError(null);
    setFallbackMessage(null);
    setAnalysis(null);
    setPack(null);
    setStreamedWorksheets([]);
    setVisibleSections(0);
    setPhase("analyzing");

    try {
      const formData = new FormData();
      formData.set("outputLanguage", "English");
      formData.set("clientId", getOrCreateClientId());
      if (!liveGenerationEnabled) {
        formData.set("topic", "The water cycle preview");
      } else if (mode === "topic") {
        formData.set("topic", topic.trim());
      } else if (selectedSample) {
        const sampleResponse = await fetch(selectedSample.imagePath, {
          signal: requestController.signal,
        });
        if (!sampleResponse.ok) throw new Error("The sample page could not be loaded.");
        const sample = await sampleResponse.blob();
        formData.set("image", new File([sample], `${selectedSample.id}.png`, { type: "image/png" }));
      } else if (selectedFile) {
        formData.set("image", selectedFile);
      }

      const response = await fetch("/api/lesson-pack", {
        method: "POST",
        body: formData,
        signal: requestController.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "TeachKit could not start this lesson pack.");
      }
      if (!response.body) throw new Error("The lesson-pack stream was unavailable.");

      let completed = false;
      await readNdjson(response.body, async (event) => {
        if (runId.current !== currentRun) return;

        switch (event.type) {
          case "fallback":
            setFallbackMessage(event.message);
            return;
          case "analysis":
            setAnalysis(event.data);
            setPhase("building");
            return;
          case "worksheet":
            setStreamedWorksheets((current) => {
              const next = [...current];
              next[event.index] = event.data;
              return next;
            });
            setVisibleSections(event.index + 1);
            await delay(180);
            return;
          case "complete":
            setPack(event.data);
            setStreamedWorksheets([...event.data.worksheets]);
            setVisibleSections(5);
            setPhase("complete");
            completed = true;
        }
      });

      if (!completed && runId.current === currentRun) {
        throw new Error("The lesson-pack stream ended before completion.");
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (runId.current === currentRun) {
        setError(requestError instanceof Error ? requestError.message : "TeachKit could not build this lesson pack.");
        setPhase("ready");
      }
    } finally {
      if (activeRequest.current === requestController) activeRequest.current = null;
    }
  }

  function reset() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    runId.current += 1;
    setPhase("ready");
    setAnalysis(null);
    setPack(null);
    setStreamedWorksheets([]);
    setFallbackMessage(null);
    setVisibleSections(0);
    setError(null);
  }

  const worksheetCount = streamedWorksheets.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#202a2e]">
      <header className="screen-only border-b border-[#d8d1c4] bg-[#fffdf8]/95">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#295e50] text-white">
              <BookOpenText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-editorial text-xl font-semibold leading-none">TeachKit</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6a7375]">
                From page to lesson
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-[#5e696c] sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white px-2.5 py-1.5">
              <Languages className="size-3.5" aria-hidden="true" />
              English pack
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e4efea] px-2.5 py-1.5 text-[#315b49]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {liveGenerationEnabled ? "GPT-5.6 workflow" : "Preview mode"}
            </span>
          </div>
        </div>
      </header>

      {!liveGenerationEnabled && (
        <div className="screen-only border-b border-[#d8c79c] bg-[#fbf1d5] px-4 py-2.5 text-center text-xs leading-5 text-[#6f5317]" role="status">
          Preview mode: live GPT-5.6 generation is disabled. Building a lesson pack shows a clearly labeled authored sample.
        </div>
      )}

      <main
        className={cn(
          "mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8",
          phase !== "ready" && "pb-28",
        )}
      >
        <section className="screen-only py-7 sm:py-9">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#295e50]">
            One page in. Every learner included.
          </p>
          <h1 className="font-editorial max-w-5xl text-[2.05rem] font-semibold leading-[1.08] tracking-[-0.025em] text-[#202a2e] sm:text-[2.7rem]">
            A complete lesson pack, taking shape before your eyes.
          </h1>
          <p className="mt-3 max-w-4xl text-[15px] leading-6 text-[#5e696c]">
            TeachKit reads the source, differentiates three worksheets, and prepares the printable extras in one visible flow.
          </p>
        </section>

        <GenerationRail
          phase={phase}
          sourceReady={canGenerate}
          sourceLabel={mode === "topic" ? "Topic ready" : "Textbook page ready"}
          worksheetCount={worksheetCount}
        />

        <div className="grid items-start gap-6 pt-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="screen-only lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[#d8d1c4] bg-[#fffdf8] p-5 shadow-[0_8px_30px_rgba(32,42,46,0.07)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6a7375]">Source</p>
                  <h2 className="font-editorial mt-1 text-2xl font-semibold">What are you teaching?</h2>
                </div>
                <span className="rounded-md bg-[#f0ece3] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5e696c]">
                  1 source
                </span>
              </div>

              <div className="mb-5 grid grid-cols-2 rounded-xl bg-[#eee9df] p-1" aria-label="Choose source type">
                <button
                  type="button"
                  aria-pressed={mode === "image"}
                  disabled={isWorking}
                  onClick={() => chooseMode("image")}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60",
                    mode === "image" ? "bg-[#fffdf8] text-[#202a2e] shadow-sm" : "text-[#677174]",
                  )}
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Photograph
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "topic"}
                  disabled={isWorking}
                  onClick={() => chooseMode("topic")}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60",
                    mode === "topic" ? "bg-[#fffdf8] text-[#202a2e] shadow-sm" : "text-[#677174]",
                  )}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Type a topic
                </button>
              </div>

              {mode === "image" ? (
                <div>
                  <label
                    htmlFor="textbook-photo"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className={cn(
                      "group flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#b9b1a5] bg-[#f8f4eb] p-5 text-center transition-colors focus-within:ring-2 focus-within:ring-[#2563eb] focus-within:ring-offset-2",
                      isWorking
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:border-[#295e50] hover:bg-[#f3f1e8]",
                    )}
                  >
                    {imagePreview ? (
                      <div className="relative h-36 w-full overflow-hidden rounded-lg border border-[#d8d1c4] bg-white">
                        <Image
                          src={imagePreview}
                          alt="Selected textbook page preview"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-[#e4efea] text-[#295e50]">
                          <ImagePlus className="size-5" aria-hidden="true" />
                        </span>
                        <span className="font-semibold">Photograph or drop a textbook page</span>
                        <span className="mt-1.5 text-xs leading-5 text-[#6a7375]">JPEG, PNG, or WebP · up to 4 MB</span>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#295e50]">
                          <Upload className="size-4" aria-hidden="true" />
                          Choose photo
                        </span>
                      </>
                    )}
                    <input
                      id="textbook-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      className="sr-only"
                      disabled={isWorking}
                      onChange={(event) => handleFile(event.target.files?.[0])}
                    />
                  </label>
                  {fileName && <p className="mt-2 truncate text-xs text-[#6a7375]">Selected: {fileName}</p>}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6a7375]">Try a sample</h3>
                      <span className="text-[11px] text-[#7a8385]">Original TeachKit page</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_PAGES.map((sample) => {
                        const isSelected = selectedSampleId === sample.id;
                        return (
                          <button
                            key={sample.id}
                            type="button"
                            disabled={isWorking}
                            onClick={() => chooseSample(sample.id)}
                            aria-pressed={isSelected}
                            className={cn(
                              "rounded-xl border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                              isSelected
                                ? "border-[#295e50] bg-[#e4efea]"
                                : "border-[#d8d1c4] bg-white hover:border-[#afa79a]",
                            )}
                          >
                            <span className="mb-2 flex items-start gap-2">
                              <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[#d8d1c4] bg-white">
                                <Image src={sample.imagePath} alt={sample.alt} fill className="object-cover" />
                              </span>
                              {isSelected && (
                                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-[#295e50] text-white">
                                  <Check className="size-3" aria-label="Selected" />
                                </span>
                              )}
                            </span>
                            <span className="block line-clamp-2 min-h-10 text-xs font-bold leading-5">
                              {sample.title}
                            </span>
                            <span className="mt-1 block text-[11px] text-[#5e696c]">
                              {sample.grade} · {sample.subject}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="topic" className="mb-2 block text-sm font-semibold">
                    Lesson topic
                  </label>
                  <textarea
                    id="topic"
                    value={topic}
                    disabled={isWorking}
                    onChange={(event) => {
                      setTopic(event.target.value);
                      setError(null);
                    }}
                    rows={6}
                    maxLength={240}
                    placeholder="For example: How fractions represent parts of a whole for Grade 4"
                    className="w-full resize-none rounded-xl border border-[#b9b1a5] bg-white p-4 text-[15px] leading-6 outline-none transition focus:border-[#295e50] focus:ring-2 focus:ring-[#295e50]/20 disabled:opacity-60"
                  />
                  <p className="mt-2 text-right text-xs text-[#7a8385]">{topic.length}/240</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-[#e1c888] bg-[#fbf1d5] p-3 text-sm leading-5 text-[#765515]" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="button"
                size="lg"
                onClick={generateDemoPack}
                disabled={!canGenerate || isWorking}
                className="mt-5 h-12 w-full bg-[#295e50] px-4 text-[15px] text-white hover:bg-[#214c41]"
              >
                {isWorking ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {liveGenerationEnabled ? "Building lesson pack" : "Preparing sample pack"}
                  </>
                ) : (
                  <>
                    {liveGenerationEnabled ? "Build lesson pack" : "Show sample pack"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#687174]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#3e725b]" aria-hidden="true" />
                <p>
                  Only upload material you are permitted to use. {liveGenerationEnabled ? (
                    <>Pages are sent to OpenAI and may be retained for abuse monitoring; TeachKit does not intentionally store them.</>
                  ) : (
                    <>This preview does not send your selected page to OpenAI.</>
                  )} Do not include personal information. A random browser identifier is used for abuse prevention.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#d8d1c4] bg-[#f8f4eb] p-4 text-xs leading-5 text-[#5e696c]">
              <strong className="block text-[#394548]">Two-call pipeline · Demo-safe fallback</strong>
              {liveGenerationEnabled
                ? "Live GPT-5.6 analysis and generation use one streamed route. If generation fails, TeachKit labels and shows the authored sample pack."
                : "The live two-call pipeline is disabled in this preview. TeachKit labels and shows the authored sample pack without sending your selected source to OpenAI."}
            </div>
          </aside>

          <section
            aria-label="Lesson pack preview"
            className={cn("min-w-0", phase !== "ready" && "order-first lg:order-none")}
          >
            {phase === "ready" ? (
              <div className="screen-only flex min-h-[620px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#d8d1c4] bg-[#fffdf8] p-7 text-center shadow-[0_14px_45px_rgba(32,42,46,0.06)] sm:p-12">
                <div className="relative mb-9 h-56 w-full max-w-md" aria-hidden="true">
                  <div className="absolute left-1/2 top-6 h-48 w-36 -translate-x-[90%] -rotate-6 rounded-lg border border-[#d8d1c4] bg-[#f8f4eb] shadow-sm" />
                  <div className="absolute left-1/2 top-2 h-52 w-40 -translate-x-1/2 rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-md">
                    <div className="h-3 w-2/3 rounded bg-[#d7e5df]" />
                    <div className="mt-5 space-y-3">
                      <div className="h-2 w-full rounded bg-[#e7e1d7]" />
                      <div className="h-2 w-5/6 rounded bg-[#e7e1d7]" />
                      <div className="h-16 rounded border border-dashed border-[#cfc7ba]" />
                      <div className="h-2 w-full rounded bg-[#e7e1d7]" />
                    </div>
                  </div>
                  <div className="absolute left-1/2 top-8 h-48 w-36 translate-x-[10%] rotate-6 rounded-lg border border-[#d8d1c4] bg-[#f8f4eb] shadow-sm" />
                </div>
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#e4efea] text-[#295e50]">
                  <ScanText className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-editorial text-3xl font-semibold">Your printable lesson pack will appear here</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#687174]">
                  One learning objective, three genuinely different practice levels, and the classroom extras teachers usually build by hand.
                </p>
                <div className="mt-7 grid w-full max-w-lg grid-cols-3 gap-2 text-xs font-semibold text-[#4f5b5e]">
                  <span className="rounded-lg border border-[#bdd1c7] bg-[#e7f0eb] px-2 py-3">Guided</span>
                  <span className="rounded-lg border border-[#c3d1db] bg-[#e7eef3] px-2 py-3">Independent</span>
                  <span className="rounded-lg border border-[#ddc1b6] bg-[#f5e9e3] px-2 py-3">Challenge</span>
                </div>
              </div>
            ) : (
              <div>
                <GenerationSummary
                  phase={phase}
                  analysis={analysis}
                  pack={pack}
                  streamedWorksheets={streamedWorksheets}
                  statusHeading={statusHeading}
                  fallbackMessage={fallbackMessage}
                />

                {fallbackMessage && (
                  <div className="screen-only mb-4 rounded-xl border border-[#e1c888] bg-[#fbf1d5] p-4 text-sm leading-5 text-[#765515]" role="status">
                    <strong className="block">Demo fallback active</strong>
                    {fallbackMessage}
                  </div>
                )}

                {phase === "analyzing" ? (
                  <div className="screen-only overflow-hidden rounded-2xl border border-[#d8d1c4] bg-[#fffdf8] p-7 shadow-[0_14px_45px_rgba(32,42,46,0.06)] sm:p-10">
                    <div className="mx-auto max-w-xl text-center">
                      {mode === "topic" ? (
                        <div className="mx-auto mb-7 flex min-h-52 max-w-md items-center justify-center rounded-xl border border-[#c8c0b4] bg-[#f8f4eb] p-8 shadow-sm">
                          <div>
                            <FileText className="mx-auto mb-4 size-8 text-[#295e50]" aria-hidden="true" />
                            <p className="font-editorial text-xl font-semibold">{topic}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative mx-auto mb-7 h-56 w-44 overflow-hidden rounded-lg border border-[#c8c0b4] bg-white p-3 shadow-md">
                          <Image
                            src={imagePreview ?? selectedSample?.imagePath ?? SAMPLE_PAGES[0].imagePath}
                            alt="Selected textbook page being analyzed"
                            fill
                            unoptimized={Boolean(imagePreview)}
                            className="object-cover"
                          />
                          <span className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-[#295e50] shadow-[0_0_18px_6px_rgba(41,94,80,0.25)] motion-reduce:animate-none" />
                        </div>
                      )}
                      <p className="font-editorial text-2xl font-semibold">Understanding the source</p>
                      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2 text-xs font-semibold text-[#5e696c]">
                        <span className="rounded-lg bg-[#f0ece3] px-2 py-3">Finding topic</span>
                        <span className="rounded-lg bg-[#f0ece3] px-2 py-3">Estimating grade</span>
                        <span className="rounded-lg bg-[#f0ece3] px-2 py-3">Mapping concepts</span>
                      </div>
                    </div>
                  </div>
                ) : analysis ? (
                  <LessonPackView
                    analysis={analysis}
                    pack={pack}
                    streamedWorksheets={streamedWorksheets}
                    visibleSections={visibleSections}
                    complete={phase === "complete"}
                    fallbackMessage={fallbackMessage}
                  />
                ) : (
                  <div className="screen-only rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-8 text-center text-sm text-[#687174]">
                    Waiting for source analysis…
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {phase !== "ready" && <CompletionToolbar phase={phase} onReset={reset} />}
    </div>
  );
}

type StageState = "done" | "active" | "waiting";

function GenerationRail({
  phase,
  sourceReady,
  sourceLabel,
  worksheetCount,
}: {
  phase: Phase;
  sourceReady: boolean;
  sourceLabel: string;
  worksheetCount: number;
}) {
  const stages: Array<{ name: string; detail: string; state: StageState }> = [
    {
      name: "Source",
      detail: sourceReady ? sourceLabel : "Choose a source",
      state: sourceReady ? "done" : "active",
    },
    {
      name: "Understand",
      detail:
        phase === "analyzing"
          ? "Reading source"
          : phase === "building" || phase === "complete"
            ? "Concepts identified"
            : "Waiting",
      state:
        phase === "analyzing"
          ? "active"
          : phase === "building" || phase === "complete"
            ? "done"
            : "waiting",
    },
    {
      name: "Differentiate",
      detail:
        phase === "complete"
          ? "3 levels ready"
          : phase === "building"
            ? `${worksheetCount} of 3 ready`
            : "Waiting",
      state: phase === "complete" ? "done" : phase === "building" ? "active" : "waiting",
    },
    {
      name: "Print",
      detail: phase === "complete" ? "Ready to print" : "Waiting",
      state: phase === "complete" ? "done" : "waiting",
    },
  ];

  return (
    <nav
      aria-label="Lesson pack progress"
      className="screen-only -mx-4 border-y border-[#d8d1c4] bg-[#fffdf8] px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <ol className="mx-auto grid max-w-[1380px] grid-cols-2 gap-x-4 gap-y-3 py-4 lg:grid-cols-4 lg:gap-6">
        {stages.map((stage, index) => (
          <li key={stage.name} className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                stage.state === "done" && "bg-[#e4efea] text-[#295e50]",
                stage.state === "active" && "bg-[#f5e9e3] text-[#a65338]",
                stage.state === "waiting" && "bg-[#f0ece3] text-[#687174]",
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-[10px] font-bold uppercase tracking-[0.08em]",
                  stage.state === "done" && "text-[#295e50]",
                  stage.state === "active" && "text-[#a65338]",
                  stage.state === "waiting" && "text-[#687174]",
                )}
              >
                {stage.name}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#202a2e]">
                {stage.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const worksheetProgressMeta = [
  {
    level: "Guided",
    number: "01",
    defaultTitle: "Start with support",
    soft: "bg-[#e4efea]",
    text: "text-[#295e50]",
  },
  {
    level: "Independent",
    number: "02",
    defaultTitle: "Practice the core",
    soft: "bg-[#e7eef3]",
    text: "text-[#3f6884]",
  },
  {
    level: "Challenge",
    number: "03",
    defaultTitle: "Think beyond",
    soft: "bg-[#f5e9e3]",
    text: "text-[#a65338]",
  },
] as const;

function GenerationSummary({
  phase,
  analysis,
  pack,
  streamedWorksheets,
  statusHeading,
  fallbackMessage,
}: {
  phase: Exclude<Phase, "ready">;
  analysis: SourceAnalysis | null;
  pack: LessonPack | null;
  streamedWorksheets: Worksheet[];
  statusHeading: RefObject<HTMLHeadingElement | null>;
  fallbackMessage: string | null;
}) {
  const worksheetCount = streamedWorksheets.filter(Boolean).length;
  const nextWorksheet = worksheetProgressMeta[worksheetCount]?.level;
  const title = pack?.title ?? analysis?.topic;
  const isComplete = phase === "complete";

  return (
    <section
      className="screen-only mb-4 rounded-2xl border border-[#d8d1c4] bg-[#fffdf8] p-4 shadow-[0_10px_35px_rgba(32,42,46,0.06)] sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#687174]">
            Live lesson pack
          </p>
          <h2
            ref={statusHeading}
            tabIndex={-1}
            className="font-editorial mt-1 text-xl font-semibold leading-6 outline-none"
          >
            {title
              ? `${title} · ${pack?.gradeLevel ?? analysis?.gradeLevel} · ${pack?.subject ?? analysis?.subject}`
              : "Reading the textbook page"}
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em]",
            isComplete ? "bg-[#e4efea] text-[#295e50]" : "bg-[#f5e9e3] text-[#a65338]",
          )}
        >
          {fallbackMessage ? "Demo pack" : isComplete ? "Pack ready" : "Streaming live"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e4efea] px-3 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#295e50]">
            {fallbackMessage ? "Demo source metadata" : "GPT-5.6 source analysis"}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-[#202a2e]">
            {fallbackMessage
              ? "Authored sample pack, not based on the submitted source"
              : analysis
                ? "Source understood in one pass"
                : "Finding topic, grade, language, and concepts"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase text-[#344145]">
          {analysis ? (
            <>
              <span className="rounded-full bg-[#fffdf8] px-2.5 py-1.5">{analysis.gradeLevel}</span>
              <span className="rounded-full bg-[#fffdf8] px-2.5 py-1.5">{analysis.subject}</span>
              <span className="rounded-full bg-[#fffdf8] px-2.5 py-1.5">{analysis.sourceLanguage}</span>
              <span className="rounded-full bg-[#fffdf8] px-2.5 py-1.5">
                {analysis.keyConcepts.length} concepts
              </span>
            </>
          ) : (
            <span className="rounded-full bg-[#fffdf8] px-2.5 py-1.5 text-[#295e50]">Scanning</span>
          )}
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f4f0e8] px-3 py-2.5 text-xs font-semibold"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              isComplete ? "bg-[#295e50]" : "animate-pulse bg-[#a65338] motion-reduce:animate-none",
            )}
          />
          {phase === "analyzing" ? "Source analysis in progress" : `${worksheetCount} of 3 worksheets ready`}
        </span>
        <span className={isComplete ? "text-[#295e50]" : "text-[#a65338]"}>
          {phase === "analyzing"
            ? "Preparing classroom context"
            : isComplete
              ? "All levels complete"
              : `${nextWorksheet ?? "Final details"} is writing now`}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {worksheetProgressMeta.map((meta, index) => {
          const worksheet = streamedWorksheets[index] ?? pack?.worksheets[index];
          const isWriting = phase === "building" && index === worksheetCount;

          return (
            <article key={meta.level} className="min-h-36 rounded-xl border border-[#d8d1c4] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("flex size-9 items-center justify-center rounded-lg text-xs font-bold", meta.soft, meta.text)}>
                  {meta.number}
                </span>
                <span className={cn("rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase", meta.soft, meta.text)}>
                  {worksheet ? "Ready" : isWriting ? "Writing" : "Queued"}
                </span>
              </div>
              <p className={cn("mt-3 text-[10px] font-bold uppercase tracking-[0.08em]", meta.text)}>
                {meta.level}
              </p>
              <h3 className="font-editorial mt-1 text-base font-semibold">
                {worksheet?.title ?? meta.defaultTitle}
              </h3>
              <div className="mt-3 border-t border-[#d8d1c4] pt-2 text-[11px] leading-4 text-[#5e696c]">
                {worksheet ? worksheet.questions[0]?.prompt : "Questions appear here as each level is validated."}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 rounded-xl bg-[#f4f0e8] p-2 sm:grid-cols-3">
        <ExtraStatus
          label="Exit quiz"
          detail={pack ? `${pack.exitQuiz.length} questions` : "5 questions"}
          ready={isComplete}
          className="bg-[#e4efea] text-[#295e50]"
        />
        <ExtraStatus
          label="Discussion"
          detail={pack ? `${pack.discussionPrompts.length} prompts` : "Discussion prompts"}
          ready={isComplete}
          className="bg-[#e7eef3] text-[#3f6884]"
        />
        <ExtraStatus
          label="Parent note"
          detail="1 family summary"
          ready={isComplete}
          className="bg-[#f5e9e3] text-[#a65338]"
        />
      </div>
    </section>
  );
}

function ExtraStatus({
  label,
  detail,
  ready,
  className,
}: {
  label: string;
  detail: string;
  ready: boolean;
  className: string;
}) {
  return (
    <div className={cn("rounded-lg px-3 py-2.5", className)}>
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.06em]">
        <span>{label}</span>
        <span>{ready ? "Ready" : "Queued"}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-[#202a2e]">{detail}</p>
    </div>
  );
}

function CompletionToolbar({ phase, onReset }: { phase: Phase; onReset: () => void }) {
  const isComplete = phase === "complete";

  return (
    <div className="screen-only fixed inset-x-0 bottom-0 z-20 border-t border-[#d8d1c4] bg-[#fffdf8]/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(32,42,46,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-[1390px] items-center justify-between gap-3">
        <div className="hidden sm:block">
          <p className="text-xs font-semibold">
            {isComplete ? "Your differentiated pack is ready" : "Your differentiated pack is assembling"}
          </p>
          <p className="mt-0.5 text-[10px] text-[#687174]">
            {isComplete ? "Review the lesson, then print all five pages." : "Print unlocks when every section is ready."}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="outline" size="lg" onClick={onReset} className="h-11 flex-1 sm:flex-none">
            <RotateCcw className="size-4" aria-hidden="true" />
            Start over
          </Button>
          <Button
            size="lg"
            disabled={!isComplete}
            onClick={() => window.print()}
            className="h-11 flex-[1.35] bg-[#295e50] text-white hover:bg-[#214c41] disabled:bg-[#d9dddc] disabled:text-[#8a9294] sm:flex-none"
          >
            <Printer className="size-4" aria-hidden="true" />
            {isComplete ? "Print lesson pack" : "Print when ready"}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function readNdjson(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ClientStreamEvent) => void | Promise<void>,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim()) await onEvent(parseStreamEvent(line));
    }

    if (done) break;
  }

  if (buffer.trim()) await onEvent(parseStreamEvent(buffer));
}

function parseStreamEvent(line: string): ClientStreamEvent {
  const parsed = ClientStreamEventSchema.safeParse(JSON.parse(line));
  if (!parsed.success) throw new Error("TeachKit received an invalid lesson-pack stream event.");
  return parsed.data;
}

function getOrCreateClientId() {
  const storageKey = "teachkit-client-id";
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return window.crypto.randomUUID();
  }
}
