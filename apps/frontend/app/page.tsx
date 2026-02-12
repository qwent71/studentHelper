import { Button } from "@student-helper/ui/web/primitives/button";
import { Header } from "@/widgets/header";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your AI-powered study companion
        </h1>
        <p className="text-muted-foreground max-w-lg text-lg">
          Get help with homework, study smarter, and ace your exams — all in one
          place.
        </p>
        <Button size="lg" className="mt-2">
          Get started
        </Button>
      </main>
    </div>
  );
}
