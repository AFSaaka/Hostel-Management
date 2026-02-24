"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // Added for Portal
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ConfirmActionProps {
  actionTrigger: React.ReactNode;
  title: string;
  onConfirm: () => Promise<any>;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmAction({
  actionTrigger,
  title,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleConfirm() {
    setLoading(true);
    toast.promise(onConfirm(), {
      loading: "Processing...",
      success: (result) => {
        if (result && result.success === false) throw new Error(result.error);
        setIsConfirming(false);
        return "Action completed";
      },
      error: (err) => err.message || "Failed to execute action",
      finally: () => setLoading(false),
    });
  }

  const variants = {
    danger: "bg-red-50 border-red-100 text-red-600",
    warning: "bg-amber-50 border-amber-100 text-amber-600",
    info: "bg-blue-50 border-blue-100 text-blue-600",
  };

  // This is the UI that pops up
  const confirmationUi = isConfirming ? (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
      onClick={() => setIsConfirming(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-3 px-4 py-2 border rounded-xl animate-in fade-in zoom-in-95 duration-200 shadow-2xl bg-white ${variants[variant]}`}
      >
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            {title}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={handleConfirm}
            className={`p-2 rounded-lg text-white shadow-sm ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            disabled={loading}
            onClick={() => setIsConfirming(false)}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-slate-600 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsConfirming(true);
        }}
        className="inline-block transition-transform active:scale-95"
      >
        {actionTrigger}
      </div>
      {mounted && createPortal(confirmationUi, document.body)}
    </>
  );
}
