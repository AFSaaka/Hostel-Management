"use client";

import { useState } from "react";
import { UserPlus, X, Loader2, Shield } from "lucide-react";
import { createAdmin } from "@/app/actions/admin";
import { toast } from "sonner"; // 1. Import toast

export function AddAdminModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;

    // 2. Wrap the action in toast.promise
    toast.promise(createAdmin(formData), {
      loading: "Creating admin account...",
      success: (result: any) => {
        // If the action returned success: false
        if (!result.success) {
          throw new Error(result.error || "Failed to create admin");
        }

        // Success Logic
        setIsOpen(false);
        formElement.reset();
        return "Administrator added successfully!";
      },
      error: (err) => err.message || "An unexpected error occurred",
    });

    setLoading(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md shadow-primary/20"
      >
        <UserPlus className="w-4 h-4" />
        Add New Admin
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Add Administrator
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              name="fullName"
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="john@hostel.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Temporary Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
              Minimum 8 characters
            </p>
          </div>

          {/* Error div removed because we are using Toast now */}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
