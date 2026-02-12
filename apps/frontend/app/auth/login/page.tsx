import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login";

export const metadata: Metadata = {
  title: "Log in — Student Helper",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
