"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";

interface SettingsPanelEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  helpHref?: string;
}

export function SettingsPanelEmptyState({
  icon: Icon,
  title,
  description,
  helpHref = "https://github.com",
}: SettingsPanelEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 md:py-6">
      <Icon className="size-10 md:size-8 text-muted-foreground mb-3" />
      <h3 className="text-base md:text-sm font-medium">{title}</h3>
      <p className="text-sm md:text-xs text-muted-foreground mt-1">
        {description}
      </p>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <a href={helpHref} target="_blank" rel="noreferrer">
          Открыть помощь
        </a>
      </Button>
    </div>
  );
}
