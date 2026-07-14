import type { LessonPack, SourceAnalysis } from "@/lib/lesson-pack";

export const GOLDEN_ANALYSIS: SourceAnalysis = {
  schemaVersion: "1.0",
  sourceMode: "image",
  topic: "The water cycle",
  gradeLevel: "Grade 4",
  subject: "Science",
  sourceLanguage: "English",
  keyConcepts: ["evaporation", "condensation", "precipitation", "collection"],
};

export const GOLDEN_PACK: LessonPack = {
  schemaVersion: "1.0",
  title: "The Water Cycle",
  gradeLevel: "Grade 4",
  subject: "Science",
  outputLanguage: "English",
  estimatedMinutes: 45,
  learningObjective:
    "Explain how water moves through evaporation, condensation, precipitation, and collection.",
  successCriteria: [
    "I can name the four main stages of the water cycle.",
    "I can describe what happens to water in each stage.",
    "I can use the cycle to explain a real-world observation.",
  ],
  worksheets: [
    {
      level: "guided",
      title: "Guided Practice",
      tagline: "Step by step",
      estimatedMinutes: 15,
      directions: "Use the word bank and clues to complete each task.",
      vocabulary: [
        { term: "Evaporation", meaning: "Liquid water warms and becomes water vapor." },
        { term: "Condensation", meaning: "Water vapor cools and forms tiny droplets." },
        { term: "Precipitation", meaning: "Water falls from clouds as rain, snow, sleet, or hail." },
        { term: "Collection", meaning: "Water gathers in oceans, lakes, rivers, and the ground." },
      ],
      workedExample:
        "A puddle becomes smaller on a sunny day because heat changes liquid water into water vapor. This is evaporation.",
      questions: [
        {
          id: "g1",
          prompt: "Put the stages in order: collection, precipitation, evaporation, condensation.",
          hint: "Begin with water warming at Earth’s surface.",
          answerLines: 2,
        },
        {
          id: "g2",
          prompt: "Clouds form during which stage? Explain using the word cools.",
          hint: "Look at the definition of condensation.",
          answerLines: 3,
        },
        {
          id: "g3",
          prompt: "Circle two places where water can collect: ocean · cloud · lake · sunlight.",
          hint: null,
          answerLines: 1,
        },
      ],
    },
    {
      level: "independent",
      title: "Independent Practice",
      tagline: "Apply and explain",
      estimatedMinutes: 15,
      directions: "Answer in complete sentences. Use scientific vocabulary where it helps.",
      vocabulary: [],
      workedExample: null,
      questions: [
        {
          id: "i1",
          prompt: "Why does a cold drink sometimes become wet on the outside of the glass?",
          hint: null,
          answerLines: 4,
        },
        {
          id: "i2",
          prompt: "Describe one path a drop of ocean water could take through the water cycle.",
          hint: null,
          answerLines: 5,
        },
        {
          id: "i3",
          prompt: "How does energy from the Sun help keep the water cycle moving?",
          hint: null,
          answerLines: 4,
        },
        {
          id: "i4",
          prompt: "What might happen to a town’s water supply after many months with very little precipitation?",
          hint: null,
          answerLines: 4,
        },
      ],
    },
    {
      level: "challenge",
      title: "Challenge",
      tagline: "Reason, connect, create",
      estimatedMinutes: 15,
      directions: "Use evidence from the water cycle to justify your thinking.",
      vocabulary: [],
      workedExample: null,
      questions: [
        {
          id: "c1",
          prompt:
            "Two identical wet towels are hung up: one in sunlight with moving air, one in a cool closed room. Predict which dries first and explain why.",
          hint: null,
          answerLines: 6,
        },
        {
          id: "c2",
          prompt:
            "Design a mini water-cycle model using a clear container. Describe what you would observe and which stage each observation represents.",
          hint: null,
          answerLines: 7,
        },
        {
          id: "c3",
          prompt:
            "A warming climate can increase evaporation. Explain one possible effect this could have elsewhere in the cycle.",
          hint: null,
          answerLines: 6,
        },
      ],
    },
  ],
  exitQuiz: [
    { id: "q1", prompt: "What change of state happens during evaporation?", answer: "Liquid water becomes water vapor (gas)." },
    { id: "q2", prompt: "Which stage forms clouds?", answer: "Condensation." },
    { id: "q3", prompt: "Name two forms of precipitation.", answer: "Any two of rain, snow, sleet, or hail." },
    { id: "q4", prompt: "Where can water collect after precipitation?", answer: "Examples include oceans, lakes, rivers, soil, and groundwater." },
    { id: "q5", prompt: "What is the main energy source for the water cycle?", answer: "The Sun." },
  ],
  discussionPrompts: [
    "Is the water you drink today new water? Why or why not?",
    "How might the water cycle look different in a desert and a rainforest?",
    "Which stage of the cycle is easiest to observe near our school?",
  ],
  parentSummary: {
    title: "What we learned today",
    body:
      "Today we explored how the same water moves again and again through evaporation, condensation, precipitation, and collection. Ask your child to explain the cycle using an example from home.",
    tryAtHome:
      "Place a cool glass of water on a table for five minutes. Notice the droplets outside the glass and ask: where did that water come from?",
  },
};
