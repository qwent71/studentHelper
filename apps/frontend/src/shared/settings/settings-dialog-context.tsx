"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MobileView = "list" | "content";

interface SettingsDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  categoryId: string;
  mobileView: MobileView;
  openToCategory: (categoryId: string) => void;
  selectCategory: (categoryId: string) => void;
  goBack: () => void;
}

const SettingsDialogContext = createContext<SettingsDialogContextValue | null>(
  null,
);

const defaultCategoryId = "account";

function buildHash(categoryId: string): string {
  return `#settings/${categoryId}`;
}

function parseHash(hash: string): { categoryId: string; mobileView: MobileView } | null {
  if (!hash.startsWith("#settings")) return null;

  const parts = hash.slice(1).split("/"); // ["settings", category?]
  const categoryId = parts[1] || null;

  if (!categoryId) {
    return { categoryId: defaultCategoryId, mobileView: "list" };
  }

  return { categoryId, mobileView: "content" };
}

export function SettingsDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const skipHashUpdate = useRef(false);

  // Sync hash → state on mount and hashchange
  useEffect(() => {
    function handleHash() {
      const parsed = parseHash(window.location.hash);
      if (parsed) {
        skipHashUpdate.current = true;
        setCategoryId(parsed.categoryId);
        setMobileView(parsed.mobileView);
        setOpenState(true);
        return;
      }

      setOpenState(false);
      setCategoryId(defaultCategoryId);
      setMobileView("list");
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Sync state → hash
  useEffect(() => {
    if (skipHashUpdate.current) {
      skipHashUpdate.current = false;
      return;
    }

    if (open) {
      const newHash = buildHash(categoryId);
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    } else if (window.location.hash.startsWith("#settings")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [open, categoryId]);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    if (!value) {
      setCategoryId(defaultCategoryId);
      setMobileView("list");
    }
  }, []);

  const openToCategory = useCallback((id: string) => {
    setCategoryId(id);
    setMobileView("content");
    setOpenState(true);
  }, []);

  const selectCategory = useCallback((id: string) => {
    setCategoryId(id);
    setMobileView("content");
  }, []);

  const goBack = useCallback(() => {
    setMobileView("list");
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      categoryId,
      mobileView,
      openToCategory,
      selectCategory,
      goBack,
    }),
    [
      open,
      setOpen,
      categoryId,
      mobileView,
      openToCategory,
      selectCategory,
      goBack,
    ],
  );

  return (
    <SettingsDialogContext value={value}>{children}</SettingsDialogContext>
  );
}

export function useSettingsDialog() {
  const context = useContext(SettingsDialogContext);
  if (!context) {
    throw new Error(
      "useSettingsDialog must be used within a SettingsDialogProvider",
    );
  }
  return context;
}
