"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { ChangePasswordDTO } from "@eventure/shared";
import { userApi } from "@/lib/api/user.api";
import { CheckCircle2 } from "lucide-react";

export default function ChangePasswordPage() {
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordDTO>();

  const onSubmit = async (data: ChangePasswordDTO) => {
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      await userApi.changePassword(data);
      setStatusMsg({ type: "success", text: "Password changed successfully." });
      reset();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatusMsg({ type: "error", text: error.message || "Failed to change password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-lg)",
        padding: "2rem",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        style={{
          paddingBottom: "1.5rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.4rem 0" }}>
          Change Password
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
          Ensure your account uses a long, secure password.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`badge ${statusMsg.type === "success" ? "badge--success" : "badge--error"}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            padding: "0.85rem 1rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            textTransform: "none",
          }}
        >
          {statusMsg.type === "success" && <CheckCircle2 size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: "28rem" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register("currentPassword", { required: "Current password is required" })}
          />
          {errors.currentPassword && (
            <span className="form-error">{errors.currentPassword.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            className="form-input"
            placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol"
            {...register("newPassword", { required: "New password is required" })}
          />
          {errors.newPassword && <span className="form-error">{errors.newPassword.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="form-input"
            placeholder="Repeat new password"
            {...register("confirmPassword", { required: "Confirm password is required" })}
          />
          {errors.confirmPassword && (
            <span className="form-error">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="button button--primary"
          style={{ marginTop: "1rem", minWidth: "10rem" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
