"use client";

import { Shield } from "lucide-react";

export function PrivacyPanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Управление настройками конфиденциальности и данных.
      </p>
      <div className="flex flex-col items-center justify-center text-center py-8 md:py-6">
        <Shield className="size-10 md:size-8 text-muted-foreground mb-3" />
        <h3 className="text-base md:text-sm font-medium">Скоро здесь появятся настройки</h3>
        <p className="text-sm md:text-xs text-muted-foreground mt-1">Мы работаем над настройками конфиденциальности.</p>
      </div>
    </div>
  );
}
