import Link from "next/link";
import {
  MessageSquare,
  TrendingUp,
  CalendarCheck,
  Plus,
  BookOpen,
  Upload,
} from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";

const cards = [
  {
    title: "Недавние чаты",
    description: "Здесь будут ваши последние диалоги с ИИ-репетитором",
    icon: MessageSquare,
    cta: { label: "Начать чат", href: "/app/chat" },
  },
  {
    title: "Прогресс обучения",
    description: "Здесь будет отображаться ваш прогресс",
    icon: TrendingUp,
  },
  {
    title: "Предстоящие задания",
    description: "Здесь будут ваши предстоящие задания",
    icon: CalendarCheck,
  },
] as const;

const quickActions = [
  { label: "Новый чат", href: "/app/chat", icon: Plus },
  { label: "Учебники", href: "/app/textbooks", icon: BookOpen },
  { label: "Загрузить файл", href: "/app/uploads", icon: Upload },
] as const;

export default function AppPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-card text-card-foreground rounded-lg border border-border p-5 shadow-sm dark:shadow-none md:p-4"
          >
            <div className="flex flex-col items-center justify-center text-center py-6 md:py-4">
              <card.icon className="size-10 md:size-8 text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium">{card.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {"cta" in card && (
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={card.cta.href}>{card.cta.label}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3">Быстрые действия</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.label} variant="outline" asChild>
              <Link href={action.href}>
                <action.icon className="size-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
