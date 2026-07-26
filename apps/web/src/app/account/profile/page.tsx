"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import { userApi } from "@/lib/api/user.api";
import { User, Upload, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface ProfileFormValues {
  name: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMsg({ type: "error", text: "Avatar image must be smaller than 2MB." });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setStatusMsg(null);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      await userApi.updateProfile(
        { name: data.name !== user?.name ? data.name : undefined },
        avatarFile || undefined,
      );
      await refreshUser();
      setStatusMsg({ type: "success", text: "Profile updated successfully!" });
      setAvatarFile(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatusMsg({ type: "error", text: error.message || "Failed to update profile." });
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
          Profile Settings
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
          Update your personal details and public profile picture.
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              background: "var(--color-canvas)",
              border: "2px solid var(--color-line)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-teal)",
              fontWeight: "700",
              fontSize: "2rem",
              position: "relative",
            }}
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                style={{ objectFit: "cover" }}
              />
            ) : user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name || "User avatar"}
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || <User size={32} />
            )}
          </div>
          <div>
            <label
              className="button button--ghost"
              style={{
                padding: "0.5rem 1rem",
                minHeight: "2.2rem",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                gap: "0.4rem",
              }}
            >
              <Upload size={14} />
              <span>{avatarFile ? "Change photo" : "Upload photo"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.78rem", color: "var(--color-muted)" }}>
              JPG, PNG or WEBP. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-input"
            value={user?.email || ""}
            disabled
            style={{
              background: "var(--color-canvas)",
              color: "var(--color-muted)",
              cursor: "not-allowed",
            }}
          />
          <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
            Email address cannot be changed.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="form-input"
            placeholder="Your name"
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Min 2 characters" },
            })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <button
          type="submit"
          className="button button--primary"
          style={{ marginTop: "1rem", minWidth: "10rem" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
