import {
  Check,
  CheckCircle2,
  Clock3,
  MessageCircleQuestion,
  Sparkles,
  Users,
} from "lucide-react";

import type { LessonPack, SourceAnalysis, Worksheet } from "@/lib/lesson-pack";
import { cn } from "@/lib/utils";

const levelStyles = {
  guided: {
    number: "01",
    rail: "bg-[#3e725b]",
    soft: "bg-[#e7f0eb]",
    text: "text-[#315b49]",
    pattern: "border-solid",
  },
  independent: {
    number: "02",
    rail: "bg-[#3f6884]",
    soft: "bg-[#e7eef3]",
    text: "text-[#31546b]",
    pattern: "border-double",
  },
  challenge: {
    number: "03",
    rail: "bg-[#a65338]",
    soft: "bg-[#f5e9e3]",
    text: "text-[#85412d]",
    pattern: "border-dashed",
  },
} as const;

interface LessonPackViewProps {
  analysis: SourceAnalysis;
  pack: LessonPack | null;
  streamedWorksheets: Worksheet[];
  visibleSections: number;
  complete: boolean;
  fallbackMessage: string | null;
}

function SectionStatus({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="screen-only inline-flex items-center gap-1.5 text-xs font-semibold text-[#3e725b]">
      <Check className="size-3.5" aria-hidden="true" />
      Ready
    </span>
  ) : (
    <span className="screen-only inline-flex items-center gap-2 text-xs font-semibold text-[#7b6229]">
      <span className="size-2 animate-pulse rounded-full bg-[#b68428] motion-reduce:animate-none" />
      Writing…
    </span>
  );
}

function AnswerLines({ count }: { count: number }) {
  return (
    <div className="mt-3 space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-px bg-[#cbc4b8]" />
      ))}
    </div>
  );
}

function WorksheetSection({ worksheet }: { worksheet: Worksheet }) {
  const style = levelStyles[worksheet.level];

  return (
    <section className="worksheet print-section relative overflow-hidden border-t border-[#d8d1c4] bg-[#fffdf8] px-5 py-8 sm:px-9 sm:py-10">
      <div className={cn("absolute inset-y-0 left-0 w-1.5", style.rail)} />
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg border-4 text-sm font-bold",
              style.soft,
              style.text,
              style.pattern,
            )}
          >
            {style.number}
          </span>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#687174]">
              {worksheet.tagline}
            </p>
            <h2 className="font-editorial text-2xl font-semibold text-[#202a2e] sm:text-3xl">
              {worksheet.title}
            </h2>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#5e696c]">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {worksheet.estimatedMinutes} min
        </span>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 border-y border-[#d8d1c4] py-3 text-sm sm:flex sm:justify-between">
        <span>Name: ____________________</span>
        <span>Date: ____________________</span>
      </div>

      <p className="mb-6 text-sm leading-6 text-[#465256]">
        <strong className="text-[#202a2e]">Directions:</strong> {worksheet.directions}
      </p>

      {worksheet.vocabulary.length > 0 && (
        <div className={cn("print-section mb-6 rounded-xl p-4", style.soft)}>
          <h3 className={cn("mb-3 text-xs font-bold uppercase tracking-[0.12em]", style.text)}>
            Word bank
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {worksheet.vocabulary.map((item) => (
              <div key={item.term} className="text-sm leading-5">
                <dt className="font-bold text-[#202a2e]">{item.term}</dt>
                <dd className="text-[#526063]">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {worksheet.workedExample && (
        <div className="print-section mb-7 border-l-4 border-[#3e725b] bg-[#f8f4eb] p-4">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#315b49]">
            Worked example
          </h3>
          <p className="text-sm leading-6 text-[#465256]">{worksheet.workedExample}</p>
        </div>
      )}

      <ol className="space-y-7">
        {worksheet.questions.map((question, index) => (
          <li key={question.id} className="question print-section">
            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#afa79a] text-xs font-bold text-[#394548]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-6 text-[#202a2e]">{question.prompt}</p>
                {question.hint && (
                  <p className="mt-2 text-sm italic text-[#687174]">Hint: {question.hint}</p>
                )}
                <AnswerLines count={question.answerLines} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BuildingPlaceholder({ label }: { label: string }) {
  return (
    <div className="screen-only min-h-44 border-t border-[#d8d1c4] bg-[#fffdf8] p-8" role="status">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-[#e7e1d7] motion-reduce:animate-none" />
        <SectionStatus complete={false} />
      </div>
      <p className="text-sm text-[#6b7476]">{label}</p>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-[#eee9df] motion-reduce:animate-none" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#eee9df] motion-reduce:animate-none" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#eee9df] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function LessonPackView({
  analysis,
  pack,
  streamedWorksheets,
  visibleSections,
  complete,
  fallbackMessage,
}: LessonPackViewProps) {
  return (
    <article className="print-pack overflow-hidden rounded-2xl border border-[#d8d1c4] bg-[#fffdf8] shadow-[0_14px_45px_rgba(32,42,46,0.08)]">
      {fallbackMessage && (
        <div className="print-only border border-[#8a6b24] bg-[#fff7df] p-3 text-sm text-[#5f4815]">
          <strong>Demo fallback:</strong> {fallbackMessage}
        </div>
      )}
      <header className="px-5 py-7 sm:px-9 sm:py-9">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-[#e4efea] px-2.5 py-1 text-xs font-bold text-[#315b49]">
              {pack?.subject ?? analysis.subject}
            </span>
            <span className="rounded-md bg-[#f0ece3] px-2.5 py-1 text-xs font-bold text-[#4e5a5d]">
              {pack?.gradeLevel ?? analysis.gradeLevel}
            </span>
            <span className="rounded-md bg-[#f0ece3] px-2.5 py-1 text-xs font-bold text-[#4e5a5d]">
              {pack?.outputLanguage ?? "English"}
            </span>
          </div>
          <SectionStatus complete={complete} />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#3e725b]">
          Differentiated lesson pack
        </p>
        <h1 className="font-editorial text-4xl font-semibold tracking-[-0.025em] text-[#202a2e] sm:text-5xl">
          {pack?.title ?? analysis.topic}
        </h1>
        <div className="mt-7 grid gap-5 border-t border-[#d8d1c4] pt-6 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#687174]">
              Learning objective
            </h2>
            <p className="text-[15px] leading-6 text-[#344145]">
              {pack?.learningObjective ?? "Building a shared objective for all three practice levels…"}
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#687174]">
              Source understood as
            </h2>
            <p className="text-sm font-semibold text-[#344145]">{analysis.topic}</p>
            <p className="mt-1 text-xs text-[#687174]">
              {analysis.keyConcepts.join(" · ")}
            </p>
          </div>
        </div>
      </header>

      {(["Guided Practice", "Independent Practice", "Challenge"] as const).map((label, index) => {
        const worksheet = streamedWorksheets[index] ?? pack?.worksheets[index];
        return worksheet ? (
          <WorksheetSection key={worksheet.level} worksheet={worksheet} />
        ) : (
          <BuildingPlaceholder key={label} label={`Preparing ${label.toLowerCase()}…`} />
        );
      })}

      {pack && visibleSections > 3 ? (
        <section className="exit-quiz print-section border-t border-[#d8d1c4] bg-[#fffdf8] px-5 py-8 sm:px-9 sm:py-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#3f6884]">
                Five quick checks
              </p>
              <h2 className="font-editorial text-3xl font-semibold text-[#202a2e]">Exit quiz</h2>
            </div>
            <SectionStatus complete={complete || visibleSections > 4} />
          </div>
          <ol className="grid gap-5 sm:grid-cols-2">
            {pack.exitQuiz.map((question, index) => (
              <li key={question.id} className="question print-section border-t border-[#d8d1c4] pt-3">
                <p className="text-sm font-semibold leading-5 text-[#202a2e]">
                  {index + 1}. {question.prompt}
                </p>
                <AnswerLines count={2} />
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <BuildingPlaceholder label="Writing the five-question exit quiz…" />
      )}

      {pack && visibleSections > 4 ? (
        <section className="print-section border-t border-[#d8d1c4] bg-[#f8f4eb] px-5 py-8 sm:px-9 sm:py-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <MessageCircleQuestion className="size-5 text-[#3f6884]" aria-hidden="true" />
                <h2 className="font-editorial text-2xl font-semibold text-[#202a2e]">Discuss together</h2>
              </div>
              <ul className="space-y-3">
                {pack.discussionPrompts.map((prompt) => (
                  <li key={prompt} className="flex gap-2.5 text-sm leading-6 text-[#465256]">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#3f6884]" aria-hidden="true" />
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="parent-note print-section rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
              <div className="mb-3 flex items-center gap-3">
                <Users className="size-5 text-[#a65338]" aria-hidden="true" />
                <h2 className="font-editorial text-xl font-semibold text-[#202a2e]">Parent note</h2>
              </div>
              <h3 className="mb-2 text-sm font-bold text-[#202a2e]">{pack.parentSummary.title}</h3>
              <p className="text-sm leading-6 text-[#526063]">{pack.parentSummary.body}</p>
              <p className="mt-4 border-t border-[#d8d1c4] pt-4 text-sm leading-6 text-[#526063]">
                <strong className="text-[#85412d]">Try at home:</strong> {pack.parentSummary.tryAtHome}
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#687174]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Prepared with TeachKit
          </div>
        </section>
      ) : (
        <BuildingPlaceholder label="Finishing discussion prompts and the family summary…" />
      )}
    </article>
  );
}
