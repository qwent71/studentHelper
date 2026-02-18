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

const menuItemClass = "gap-3 px-3 py-1.5 text-[13px]";
const menuIconClass = "size-[18px] text-muted-foreground";

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
            className="w-[calc(var(--radix-dropdown-menu-trigger-width)+8px)] min-w-56 rounded-xl p-1.5"
            side="top"
            align="start"
            alignOffset={-4}
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
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
            <DropdownMenuSeparator className="mx-3" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => openToCategory("appearance")}
              >
                <Paintbrush className={menuIconClass} />
                Personalization
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => setOpen(true)}
              >
                <Settings className={menuIconClass} />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mx-3" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() =>
                  window.open("https://github.com", "_blank")
                }
              >
                <HelpCircle className={menuIconClass} />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => setShowLogoutConfirm(true)}
              >
                <LogOut className={menuIconClass} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSigningOut}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isSigningOut}
                onClick={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
              >
                {isSigningOut ? "Logging out..." : "Log out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
