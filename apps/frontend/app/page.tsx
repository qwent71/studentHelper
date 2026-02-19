import { Button } from "@student-helper/ui/web/primitives/button";
import { Header } from "@/widgets/header";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 md:px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Ваш ИИ-помощник для учёбы
        </h1>
        <p className="text-muted-foreground max-w-lg text-lg">
          Помощь с домашними заданиями, умная подготовка к экзаменам — всё в одном месте.
        </p>
        <Button size="lg" className="mt-2">
          Начать
        </Button>
      </main>
    </div>
  );
}
