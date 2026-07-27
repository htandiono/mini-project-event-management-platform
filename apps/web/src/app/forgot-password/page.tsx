"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { ForgotPasswordDTO } from "@eventure/shared";
import { authApi } from "@/lib/api/auth.api";

export default function ForgotPasswordPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDTO>();

  const onSubmit = async (data: ForgotPasswordDTO) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data);
      setSuccessMsg(
        "If your email is registered, a password reset link has been sent to your inbox.",
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to send reset link.");
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
          Reset your password
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            textAlign: "center",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>

        {successMsg ? (
          <div
            className="badge badge--success"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1.5rem",
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.9rem",
              textTransform: "none",
              lineHeight: 1.5,
            }}
          >
            {successMsg}
          </div>
        ) : (
          <>
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
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                className="button button--primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

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
          Remember your password?{" "}
          <Link href="/login" className="text-link" style={{ color: "var(--color-primary)" }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
