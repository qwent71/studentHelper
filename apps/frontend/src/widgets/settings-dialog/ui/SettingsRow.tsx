import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@student-helper/ui/web/primitives/card";

interface SettingsRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <Card className="gap-0 rounded-2xl border-0 bg-muted/50 py-0 shadow-none md:rounded-lg md:border md:bg-card md:shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-base font-medium md:text-sm">
          {title}
        </CardTitle>
        <CardDescription className="text-sm md:text-xs">
          {description}
        </CardDescription>
        <CardAction className="self-center">{children}</CardAction>
      </CardHeader>
    </Card>
  );
}
