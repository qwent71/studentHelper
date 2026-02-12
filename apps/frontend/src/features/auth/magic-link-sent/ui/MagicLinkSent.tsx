"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@student-helper/ui/web/primitives/field";
import { signIn } from "@/shared/auth/auth-client";

const RESEND_INTERVAL = 60;

export function MagicLinkSent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [countdown, setCountdown] = useState(RESEND_INTERVAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (!email) return;
    setError(null);
    setLoading(true);

    const { error: magicError } = await signIn.magicLink({
      email,
      callbackURL: "/app",
    });

    setLoading(false);

    if (magicError) {
      setError(magicError.message ?? "Не удалось отправить ссылку");
      return;
    }

    setResent(true);
    setCountdown(RESEND_INTERVAL);
    setTimeout(() => setResent(false), 3000);
  }, [email]);

  const canResend = countdown <= 0 && !loading;

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <Mail className="text-muted-foreground size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold">Проверьте почту</h1>
            <FieldDescription>
              На{" "}
              {email ? <strong>{email}</strong> : "вашу почту"}{" "}
              отправлена ссылка для входа. Перейдите по ней, чтобы
              войти в аккаунт.
            </FieldDescription>
          </div>
        </div>

        {error && <FieldError>{error}</FieldError>}

        {resent && (
          <div className="text-muted-foreground rounded-md border p-3 text-center text-sm">
            Ссылка отправлена повторно
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          disabled={!canResend}
          onClick={handleResend}
        >
          {loading
            ? "Отправка..."
            : canResend
              ? "Отправить повторно"
              : `Отправить повторно (${countdown}с)`}
        </Button>

        <FieldDescription className="text-center">
          <Link href="/auth/login">Вернуться ко входу</Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
