import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      {children}
    </div>
  );
}
