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

interface SettingsNav {
  categoryId: string | null;
  subPageId: string | null;
}

type MobileView = "list" | "category" | "subpage";

interface SettingsDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  nav: SettingsNav;
  mobileView: MobileView;
  openToCategory: (categoryId: string) => void;
  selectCategory: (categoryId: string) => void;
  selectSubPage: (subPageId: string) => void;
  goBack: () => void;
}

const SettingsDialogContext = createContext<SettingsDialogContextValue | null>(
  null,
);

const initialNav: SettingsNav = { categoryId: "account", subPageId: null };

function buildHash(nav: SettingsNav): string {
  if (!nav.categoryId) return "#settings";
  if (nav.subPageId) return `#settings/${nav.categoryId}/${nav.subPageId}`;
  return `#settings/${nav.categoryId}`;
}

function parseHash(hash: string): { nav: SettingsNav; mobileView: MobileView } | null {
  if (!hash.startsWith("#settings")) return null;

  const parts = hash.slice(1).split("/"); // ["settings", category?, subPage?]
  const categoryId = parts[1] || null;
  const subPageId = parts[2] || null;

  if (!categoryId) {
    return { nav: initialNav, mobileView: "list" };
  }

  if (subPageId) {
    return { nav: { categoryId, subPageId }, mobileView: "subpage" };
  }

  return { nav: { categoryId, subPageId: null }, mobileView: "category" };
}

export function SettingsDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [nav, setNav] = useState<SettingsNav>(initialNav);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const skipHashUpdate = useRef(false);

  // Sync hash → state on mount and hashchange
  useEffect(() => {
    function handleHash() {
      const parsed = parseHash(window.location.hash);
      if (parsed) {
        skipHashUpdate.current = true;
        setNav(parsed.nav);
        setMobileView(parsed.mobileView);
        setOpenState(true);
        return;
      }

      setOpenState(false);
      setNav(initialNav);
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
      const newHash = buildHash(nav);
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    } else if (window.location.hash.startsWith("#settings")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [open, nav]);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    if (!value) {
      setNav(initialNav);
      setMobileView("list");
    }
  }, []);

  const openToCategory = useCallback((categoryId: string) => {
    setNav({ categoryId, subPageId: null });
    setMobileView("category");
    setOpenState(true);
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    setNav({ categoryId, subPageId: null });
    setMobileView("category");
  }, []);

  const selectSubPage = useCallback(
    (subPageId: string) => {
      setNav({ categoryId: nav.categoryId, subPageId });
      setMobileView("subpage");
    },
    [nav.categoryId],
  );

  const goBack = useCallback(() => {
    if (mobileView === "subpage") {
      setNav((prev) => ({ ...prev, subPageId: null }));
      setMobileView("category");
    } else if (mobileView === "category") {
      setMobileView("list");
    }
  }, [mobileView]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      nav,
      mobileView,
      openToCategory,
      selectCategory,
      selectSubPage,
      goBack,
    }),
    [
      open,
      setOpen,
      nav,
      mobileView,
      openToCategory,
      selectCategory,
      selectSubPage,
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
