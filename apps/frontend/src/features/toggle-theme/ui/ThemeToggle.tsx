"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-helper/ui/web/primitives/select";
import { Skeleton } from "@student-helper/ui/web/primitives/skeleton";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="h-10 w-[160px] rounded-md md:h-9 md:w-[140px]" />;
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="h-10 w-[160px] text-base md:h-9 md:w-[140px] md:text-sm">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {themes.map(({ value, label, icon: Icon }) => (
          <SelectItem key={value} value={value} className="py-2.5 md:py-1.5">
            <Icon className="size-4" />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
