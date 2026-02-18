"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@student-helper/ui/web/primitives/drawer";
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
import { Button } from "@student-helper/ui/web/primitives/button";
import { cn } from "@student-helper/ui/utils/cn";
import { useSettingsDialog } from "@/shared/settings";
import { signOut } from "@/shared/auth/auth-client";
import { settingsCategories } from "../model/settings-navigation";
import { SettingsContent } from "./SettingsContent";

function CategoryList() {
  const { selectCategory } = useSettingsDialog();

  return (
    <div className="px-4 pb-4">
      <div className="bg-muted/50 overflow-hidden rounded-2xl">
        {settingsCategories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => selectCategory(category.id)}
            className={cn(
              "hover:bg-accent flex w-full items-center gap-4 px-4 py-3.5 text-base transition-colors",
              index < settingsCategories.length - 1 && "border-border/50 border-b",
            )}
          >
            <category.icon className="text-muted-foreground size-5" />
            <span className="flex-1 text-left">{category.label}</span>
            <ChevronRight className="text-muted-foreground size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileActionItems() {
  const router = useRouter();
  const { setOpen } = useSettingsDialog();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);

    if (error) return;

    setOpen(false);
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      <div className="px-4 pb-4">
        <div className="bg-muted/50 overflow-hidden rounded-2xl">
          <button
            type="button"
            onClick={() => window.open("https://github.com", "_blank")}
            className="border-border/50 hover:bg-accent flex w-full items-center gap-4 border-b px-4 py-3.5 text-base transition-colors"
          >
            <HelpCircle className="text-muted-foreground size-5" />
            <span className="flex-1 text-left">Help</span>
            <ExternalLink className="text-muted-foreground size-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-destructive hover:bg-accent flex w-full items-center gap-4 px-4 py-3.5 text-base transition-colors"
          >
            <LogOut className="size-5" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </div>

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
    </>
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
          {mobileView === "content" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goBack}
              className="shrink-0"
            >
              <ArrowLeft className="size-5" />
              <span className="sr-only">Back</span>
            </Button>
          ) : (
            <div className="size-8 shrink-0" />
          )}
          <DrawerTitle className="flex-1 text-center text-lg">
            {mobileView === "content" && activeCategory
              ? activeCategory.label
              : "Settings"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Application settings and preferences
          </DrawerDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="shrink-0"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerHeader>
        <div className="h-[80vh] overflow-y-auto">
          {mobileView === "list" ? (
            <>
              <CategoryList />
              <MobileActionItems />
            </>
          ) : (
            <div className="px-4 pb-6">
              <SettingsContent />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
