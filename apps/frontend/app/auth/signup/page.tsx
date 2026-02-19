import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/features/auth/signup";

export const metadata: Metadata = {
  title: "Регистрация — Student Helper",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
