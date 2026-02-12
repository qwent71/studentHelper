"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import { Input } from "@student-helper/ui/web/primitives/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@student-helper/ui/web/primitives/tabs";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@student-helper/ui/web/primitives/field";
import { signIn } from "@/shared/auth/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Failed to sign in");
      setLoading(false);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    const redirectTo =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/app";
    router.push(redirectTo);
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: magicError } = await signIn.magicLink({
      email: magicEmail,
      callbackURL: "/app",
    });

    setLoading(false);

    if (magicError) {
      setError(magicError.message ?? "Не удалось отправить ссылку");
      return;
    }

    setMagicLinkSent(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Добро пожаловать</h1>
          <FieldDescription>
            Нет аккаунта?{" "}
            <Link href="/auth/signup">Зарегистрироваться</Link>
          </FieldDescription>
        </div>
        {error && <FieldError>{error}</FieldError>}

        <Tabs
          defaultValue="password"
          onValueChange={() => setError(null)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="password">Пароль</TabsTrigger>
            <TabsTrigger value="magic-link">Без пароля</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
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
                    autoComplete="current-password"
                  />
                </Field>
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Вход..." : "Войти"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="magic-link">
            {magicLinkSent ? (
              <div className="text-muted-foreground rounded-md border p-4 text-center text-sm">
                Ссылка отправлена на <strong>{magicEmail}</strong>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="magic-email">Email</FieldLabel>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </Field>
                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Отправка..." : "Отправить ссылку для входа"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <FieldSeparator>Или</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Войти через Google
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
    </div>
  );
}
