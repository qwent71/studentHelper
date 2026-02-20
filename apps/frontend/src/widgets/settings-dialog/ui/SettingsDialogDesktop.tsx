"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@student-helper/ui/web/primitives/dialog";
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
        closeLabel="Закрыть"
        className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      >
        <DialogTitle className="sr-only">Настройки</DialogTitle>
        <DialogDescription className="sr-only">
          Настройки и параметры приложения
        </DialogDescription>
        <SidebarProvider
          className="items-start"
          style={
            {
              "--sidebar": "var(--popover)",
              "--sidebar-foreground": "var(--popover-foreground)",
              "--sidebar-accent": "var(--accent)",
              "--sidebar-accent-foreground": "var(--accent-foreground)",
              "--sidebar-border": "var(--border)",
            } as React.CSSProperties
          }
        >
          <Sidebar collapsible="none" className="hidden border-r border-border md:flex">
            <SidebarContent className="pt-2">
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
                {activeCategory?.label ?? "Настройки"}
              </h2>
            </header>
            <div className="flex-1 overflow-y-auto pt-0 p-4">
              <SettingsContent />
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
