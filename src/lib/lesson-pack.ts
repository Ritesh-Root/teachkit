import { z } from "zod";

export const SourceModeSchema = z.enum(["image", "topic"]);

export const SourceAnalysisSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    sourceMode: SourceModeSchema,
    topic: z.string().min(2).max(120),
    gradeLevel: z.string().min(2).max(40),
    subject: z.string().min(2).max(60),
    sourceLanguage: z.string().min(2).max(60),
    keyConcepts: z.array(z.string().min(1).max(60)).min(3).max(6),
  })
  .strict();

const WorksheetQuestionSchema = z
  .object({
    id: z.string().min(1).max(20),
    prompt: z.string().min(5).max(500),
    hint: z.string().min(2).max(240).nullable(),
    answerLines: z.number().int().min(1).max(8),
  })
  .strict();

const VocabularyItemSchema = z
  .object({
    term: z.string().min(1).max(60),
    meaning: z.string().min(3).max(220),
  })
  .strict();

function worksheetSchema(level: "guided" | "independent" | "challenge") {
  return z
    .object({
      level: z.literal(level),
      title: z.string().min(3).max(80),
      tagline: z.string().min(3).max(80),
      estimatedMinutes: z.number().int().min(5).max(30),
      directions: z.string().min(5).max(320),
      vocabulary: z.array(VocabularyItemSchema).max(6),
      workedExample: z.string().min(5).max(600).nullable(),
      questions: z.array(WorksheetQuestionSchema).min(3).max(6),
    })
    .strict();
}

export const GuidedWorksheetSchema = worksheetSchema("guided");
export const IndependentWorksheetSchema = worksheetSchema("independent");
export const ChallengeWorksheetSchema = worksheetSchema("challenge");
export const WorksheetSchema = z.discriminatedUnion("level", [
  GuidedWorksheetSchema,
  IndependentWorksheetSchema,
  ChallengeWorksheetSchema,
]);

const QuizQuestionSchema = z
  .object({
    id: z.string().min(1).max(20),
    prompt: z.string().min(5).max(300),
    answer: z.string().min(1).max(300),
  })
  .strict();

export const LessonPackSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    title: z.string().min(3).max(120),
    gradeLevel: z.string().min(2).max(40),
    subject: z.string().min(2).max(60),
    outputLanguage: z.string().min(2).max(60),
    estimatedMinutes: z.number().int().min(20).max(120),
    learningObjective: z.string().min(10).max(500),
    successCriteria: z.array(z.string().min(5).max(240)).min(2).max(4),
    worksheets: z.tuple([
      GuidedWorksheetSchema,
      IndependentWorksheetSchema,
      ChallengeWorksheetSchema,
    ]),
    exitQuiz: z.array(QuizQuestionSchema).length(5),
    discussionPrompts: z.array(z.string().min(5).max(300)).min(3).max(5),
    parentSummary: z
      .object({
        title: z.string().min(3).max(100),
        body: z.string().min(20).max(700),
        tryAtHome: z.string().min(10).max(500),
      })
      .strict(),
  })
  .strict();

export type SourceMode = z.infer<typeof SourceModeSchema>;
export type SourceAnalysis = z.infer<typeof SourceAnalysisSchema>;
export type Worksheet = z.infer<typeof WorksheetSchema>;
export type WorksheetLevel = Worksheet["level"];
export type WorksheetQuestion = Worksheet["questions"][number];
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type LessonPack = z.infer<typeof LessonPackSchema>;
