import { type JSX } from "react";
import { cn } from "@student-helper/ui/utils/cn";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={cn(
        "rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
    >
      {children}
    </code>
  );
}
