import { type JSX } from "react";
import { cn } from "@student-helper/ui/utils/cn";

export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={cn(
        "group rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/25 hover:bg-accent",
        className
      )}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2 className="mb-2 text-lg font-semibold text-card-foreground">
        {title} <span className="transition-transform group-hover:translate-x-1 inline-block">-&gt;</span>
      </h2>
      <p className="text-sm text-muted-foreground">{children}</p>
    </a>
  );
}
