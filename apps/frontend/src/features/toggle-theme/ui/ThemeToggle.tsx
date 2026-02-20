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
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

const themeValues = new Set<ThemeValue>(themes.map(({ value }) => value));

function isThemeValue(value: string | undefined): value is ThemeValue {
  if (!value) return false;
  return themeValues.has(value as ThemeValue);
}

export function getThemeSelectValue(
  theme: string | undefined,
  resolvedTheme: string | undefined,
): ThemeValue {
  if (isThemeValue(theme)) {
    return theme;
  }

  if (isThemeValue(resolvedTheme)) {
    return resolvedTheme;
  }

  return "system";
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const selectValue = getThemeSelectValue(theme, resolvedTheme);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="h-10 w-[160px] rounded-md md:h-9 md:w-[140px]" />;
  }

  return (
    <Select value={selectValue} onValueChange={setTheme}>
      <SelectTrigger className="h-10 w-[160px] text-base md:h-9 md:w-[140px] md:text-sm">
        <SelectValue placeholder="Тема" />
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
