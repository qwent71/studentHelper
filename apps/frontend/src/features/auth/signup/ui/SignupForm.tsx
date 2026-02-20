"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import { Input } from "@student-helper/ui/web/primitives/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@student-helper/ui/web/primitives/field";
import { signIn, signUp } from "@/shared/auth/auth-client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message ?? "Не удалось создать аккаунт");
      setLoading(false);
      return;
    }

    router.push("/app");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    await signIn.social({
      provider: "google",
      callbackURL: "/app",
      errorCallbackURL: "/auth/signup",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md">
              <GraduationCap className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Создать аккаунт</h1>
            <FieldDescription>
              Уже есть аккаунт?{" "}
              <Link href="/auth/login">Войти</Link>
            </FieldDescription>
          </div>
          {error && <FieldError>{error}</FieldError>}
          <Field>
            <FieldLabel htmlFor="name">Имя</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Эл. почта</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <FieldDescription>Минимум 8 символов</FieldDescription>
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Создание..." : "Зарегистрироваться"}
            </Button>
          </Field>
          <FieldSeparator>Или</FieldSeparator>
          <Field>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              disabled={googleLoading || loading}
              onClick={handleGoogleSignIn}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 md:size-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              {googleLoading ? "Перенаправление..." : "Войти через Google"}
            </Button>
          </Field>
          <p className="text-muted-foreground text-center text-xs">
            Продолжая, вы соглашаетесь с{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
              Условиями использования
            </Link>{" "}и{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Политикой конфиденциальности
            </Link>.
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
