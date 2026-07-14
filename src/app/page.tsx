import { TeachKitApp } from "@/components/teachkit-app";

export default function Home() {
  return <TeachKitApp liveGenerationEnabled={Boolean(process.env.OPENAI_API_KEY)} />;
}
