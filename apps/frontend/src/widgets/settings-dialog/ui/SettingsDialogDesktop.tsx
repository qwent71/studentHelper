"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@student-helper/ui/web/primitives/dialog";
import { Button } from "@student-helper/ui/web/primitives/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@student-helper/ui/web/primitives/sidebar";
import { useSettingsDialog } from "@/shared/settings";
import { settingsCategories } from "../model/settings-navigation";
import { SettingsContent } from "./SettingsContent";

export function SettingsDialogDesktop() {
  const { open, setOpen, categoryId, selectCategory } = useSettingsDialog();

  const activeCategory = settingsCategories.find(
    (c) => c.id === categoryId,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Application settings and preferences
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <div className="flex h-12 shrink-0 items-center px-2">
              <DialogClose asChild>
                <Button variant="ghost" size="icon-xs">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {settingsCategories.map((category) => (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          isActive={categoryId === category.id}
                          onClick={() => selectCategory(category.id)}
                        >
                          <category.icon />
                          <span>{category.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-12 shrink-0 items-center gap-2 px-4">
              <h2 className="text-sm font-medium">
                {activeCategory?.label ?? "Settings"}
              </h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <SettingsContent />
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
