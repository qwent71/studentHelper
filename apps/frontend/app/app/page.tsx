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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@student-helper/ui/web/primitives/card";

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
          <Card
            key={card.title}
            className="gap-0 py-0 dark:shadow-none"
          >
            <CardContent className="flex flex-col items-center justify-center py-6 text-center md:py-4">
              <card.icon className="mb-3 size-10 text-muted-foreground md:size-8" />
              <CardTitle className="text-sm">{card.title}</CardTitle>
              <CardDescription className="mt-1 text-xs">
                {card.description}
              </CardDescription>
              {"cta" in card && (
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={card.cta.href}>{card.cta.label}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Быстрые действия</h2>
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

      <Button variant="outline">
        <Plus className="size-4" />
        Новый чат
      </Button>
    </div>
  );
}
