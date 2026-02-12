import type { Metadata } from "next";
import { Suspense } from "react";
import { MagicLinkSent } from "@/features/auth/magic-link-sent";

export const metadata: Metadata = {
  title: "Проверьте почту — Student Helper",
};

export default function MagicLinkSentPage() {
  return (
    <Suspense>
      <MagicLinkSent />
    </Suspense>
  );
}
