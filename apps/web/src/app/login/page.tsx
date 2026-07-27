"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { LoginDTO } from "@eventure/shared";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDTO>();

  const onSubmit = async (data: LoginDTO) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await login(data);
      if (user.role === "ORGANIZER") {
        router.push("/organizer/dashboard");
      } else {
        router.push("/account");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Login failed. Please check your credentials.");
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
            fontSize: "2rem",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            textAlign: "center",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          Log in to your Eventure account
        </p>

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

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-link" style={{ fontSize: "0.82rem" }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            className="button button--primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log In"}
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
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-link" style={{ color: "var(--color-primary)" }}>
            Join Eventure
          </Link>
        </div>
      </div>
    </div>
  );
}
