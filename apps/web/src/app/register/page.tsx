"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { RegisterDTO } from "@eventure/shared";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterDTO>({
    defaultValues: {
      role: "CUSTOMER",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterDTO) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await authRegister(data);
      if (user.role === "ORGANIZER") {
        router.push("/organizer/dashboard");
      } else {
        router.push("/account");
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Array<{ message: string }> };
      if (error.errors && error.errors.length > 0) {
        setErrorMsg(error.errors.map((e) => e.message).join(". "));
      } else {
        setErrorMsg(error.message || "Registration failed. Please check your inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="shell section"
      style={{ maxWidth: "32rem", marginInline: "auto", paddingBlock: "3rem" }}
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
          Join Eventure
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            textAlign: "center",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          Create an account to discover or host memorable events
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
            <label className="form-label">I want to</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  border: "1px solid",
                  borderColor:
                    selectedRole === "CUSTOMER" ? "var(--color-teal)" : "var(--color-line)",
                  borderRadius: "var(--radius-sm)",
                  background: selectedRole === "CUSTOMER" ? "rgba(23, 109, 101, 0.08)" : "white",
                  cursor: "pointer",
                  fontWeight: "650",
                  fontSize: "0.92rem",
                }}
              >
                <input type="radio" value="CUSTOMER" {...register("role")} />
                <span>Attend Events</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  border: "1px solid",
                  borderColor:
                    selectedRole === "ORGANIZER" ? "var(--color-teal)" : "var(--color-line)",
                  borderRadius: "var(--radius-sm)",
                  background: selectedRole === "ORGANIZER" ? "rgba(23, 109, 101, 0.08)" : "white",
                  cursor: "pointer",
                  fontWeight: "650",
                  fontSize: "0.92rem",
                }}
              >
                <input type="radio" value="ORGANIZER" {...register("role")} />
                <span>Organize Events</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              {selectedRole === "ORGANIZER" ? "Organization / Brand name" : "Full name"}
            </label>
            <input
              id="name"
              className="form-input"
              placeholder={
                selectedRole === "ORGANIZER" ? "Purwadhika / Ismaya Live" : "Budi Santoso"
              }
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="budi@example.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
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
              Confirm password
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

          {selectedRole === "CUSTOMER" && (
            <div className="form-group">
              <label className="form-label" htmlFor="referralCode">
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                className="form-input"
                placeholder="e.g. EVT-ABCD-1234"
                {...register("referralCode")}
              />
              <span
                style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "0.2rem" }}
              >
                Get 10,000 Points coupon (100% discount, max Rp 10.000) when registering with a
                friend&apos;s code!
              </span>
            </div>
          )}

          <button
            type="submit"
            className="button button--primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link href="/login" className="text-link" style={{ color: "var(--color-primary)" }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
