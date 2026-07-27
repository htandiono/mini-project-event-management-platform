"use client";

import React from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <button
        type="button"
        className="button button--ghost"
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={`button ${isDestructive ? "button--primary" : "button--light"}`}
        style={isDestructive ? { background: "#96382f", color: "white" } : undefined}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p style={{ margin: 0, color: "var(--color-ink)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}
