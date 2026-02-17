"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@student-helper/ui/web/primitives/drawer";
import { Button } from "@student-helper/ui/web/primitives/button";
import { useSettingsDialog } from "@/shared/settings";
import { settingsCategories } from "../model/settings-navigation";
import { SettingsContent } from "./SettingsContent";

function CategoryList() {
  const { selectCategory } = useSettingsDialog();

  return (
    <div className="space-y-1 px-4 pb-4">
      {settingsCategories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => selectCategory(category.id)}
          className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
        >
          <category.icon className="text-muted-foreground size-4" />
          <span className="flex-1 text-left">{category.label}</span>
          <ChevronRight className="text-muted-foreground size-4" />
        </button>
      ))}
    </div>
  );
}

export function SettingsDialogMobile() {
  const { open, setOpen, categoryId, mobileView, goBack } = useSettingsDialog();

  const activeCategory = settingsCategories.find(
    (c) => c.id === categoryId,
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center gap-2">
          {mobileView === "content" && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={goBack}
              className="shrink-0"
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <DrawerTitle>
            {mobileView === "content" && activeCategory
              ? activeCategory.label
              : "Settings"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Application settings and preferences
          </DrawerDescription>
        </DrawerHeader>
        <div className="h-[80vh] overflow-y-auto">
          {mobileView === "list" ? (
            <CategoryList />
          ) : (
            <div className="px-4 pb-4">
              <SettingsContent />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
