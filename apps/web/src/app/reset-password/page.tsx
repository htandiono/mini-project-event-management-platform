"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ResetPasswordDTO } from "@eventure/shared";
import { authApi } from "@/lib/api/auth.api";
import { Skeleton } from "@/components/ui/Skeleton";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordDTO>({
    defaultValues: {
      token,
    },
  });

  const onSubmit = async (data: ResetPasswordDTO) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(data);
      router.push("/login?reset=success");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to reset password. The link may be expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="shell section"
      style={{ maxWidth: "28rem", marginInline: "auto", paddingBlock: "4rem" }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1.8rem",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          Set new password
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            textAlign: "center",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          Please enter your new password below.
        </p>

        {!token && (
          <div
            className="badge badge--error"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1.5rem",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              textTransform: "none",
            }}
          >
            Missing reset token in URL. Please use the exact link from your email.
          </div>
        )}

        {errorMsg && (
          <div
            className="badge badge--error"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1.5rem",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              textTransform: "none",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("token", { required: true })} />

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat password"
              {...register("confirmPassword", { required: "Confirm password is required" })}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="button button--primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-line)",
            fontSize: "0.92rem",
            color: "var(--color-muted)",
          }}
        >
          <Link href="/login" className="text-link" style={{ color: "var(--color-primary)" }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="shell section" style={{ textAlign: "center" }}>
          <Skeleton width="20rem" height="15rem" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
