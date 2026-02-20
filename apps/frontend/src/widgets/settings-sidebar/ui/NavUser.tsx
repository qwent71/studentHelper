"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Paintbrush,
  Settings,
  HelpCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@student-helper/ui/web/primitives/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@student-helper/ui/web/primitives/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@student-helper/ui/web/primitives/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@student-helper/ui/web/primitives/sidebar";
import type { User } from "@/entities/user";
import { signOut } from "@/shared/auth/auth-client";
import { useSettingsDialog } from "@/shared/settings";

const menuItemClass =
  "gap-2 px-2 py-1.5 text-sm data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground";
const menuIconClass = "size-4 text-muted-foreground";

interface NavUserProps {
  user: User;
}

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { setOpen, openToCategory } = useSettingsDialog();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);

    if (error) return;

    router.push("/auth/login");
    router.refresh();
  }

  if (isMobile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setOpen(true)}
          >
            <Avatar className="size-8 rounded-lg">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className="rounded-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <ChevronRight className="text-muted-foreground ml-auto size-5" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-sidebar text-sidebar-foreground border-sidebar-border w-[calc(var(--radix-dropdown-menu-trigger-width)+8px)] min-w-56 rounded-md p-1"
            side="top"
            align="start"
            alignOffset={-4}
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar className="size-9 rounded-lg">
                  {user.image && (
                    <AvatarImage src={user.image} alt={user.name} />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => openToCategory("appearance")}
              >
                <Paintbrush className={menuIconClass} />
                Персонализация
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => setOpen(true)}
              >
                <Settings className={menuIconClass} />
                Настройки
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() =>
                  window.open("https://github.com", "_blank")
                }
              >
                <HelpCircle className={menuIconClass} />
                Помощь
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => setShowLogoutConfirm(true)}
              >
                <LogOut className={menuIconClass} />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Выйти?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите выйти из аккаунта?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSigningOut}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isSigningOut}
                onClick={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
              >
                {isSigningOut ? "Выход..." : "Выйти"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
