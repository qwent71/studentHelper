import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-2xl p-4 md:rounded-lg md:border md:bg-transparent md:p-4">
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium md:text-sm">{title}</p>
        <p className="text-muted-foreground text-sm md:text-xs">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
