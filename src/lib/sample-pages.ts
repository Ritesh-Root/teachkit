export interface SamplePage {
  id: string;
  title: string;
  grade: string;
  subject: string;
  imagePath: string;
  alt: string;
}

export const SAMPLE_PAGES: readonly SamplePage[] = [
  {
    id: "water-cycle",
    title: "The water cycle",
    grade: "Grade 4",
    subject: "Science",
    imagePath: "/samples/water-cycle.png",
    alt: "Original sample page about the water cycle",
  },
  {
    id: "fractions",
    title: "Fractions in everyday life",
    grade: "Grade 4",
    subject: "Math",
    imagePath: "/samples/fractions.png",
    alt: "Original sample page about fractions",
  },
  {
    id: "plant-parts",
    title: "How plant parts work",
    grade: "Grade 3",
    subject: "Science",
    imagePath: "/samples/plant-parts.png",
    alt: "Original sample page about plant parts",
  },
  {
    id: "ancient-egypt",
    title: "Life along the Nile",
    grade: "Grade 6",
    subject: "History",
    imagePath: "/samples/ancient-egypt.png",
    alt: "Original sample page about life in ancient Egypt",
  },
  {
    id: "persuasive-writing",
    title: "Build a persuasive argument",
    grade: "Grade 5",
    subject: "English",
    imagePath: "/samples/persuasive-writing.png",
    alt: "Original sample page about persuasive writing",
  },
  {
    id: "simple-machines",
    title: "Simple machines at work",
    grade: "Grade 6",
    subject: "Science",
    imagePath: "/samples/simple-machines.png",
    alt: "Original sample page about simple machines",
  },
];
