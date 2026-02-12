import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up — Student Helper",
};

export default function SignupPage() {
  return <SignupForm />;
}
