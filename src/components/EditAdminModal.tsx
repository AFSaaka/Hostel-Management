"use client";

import { useState } from "react";
import { NotebookPen, X, Loader2 } from "lucide-react";
import { updateAdmin } from "@/app/actions/admin";
import { toast } from "sonner"; // 1. Import toast

interface EditAdminProps {
  admin: { id: string; fullName: string | null; email: string };
}

export function EditAdminModal({ admin }: EditAdminProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // 2. Wrap the update action in a toast promise
    toast.promise(updateAdmin(admin.id, formData), {
      loading: "Updating administrator...",
      success: (result: any) => {
        if (!result.success) throw new Error(result.error || "Update failed");

        setIsOpen(false);
        return "Admin profile updated successfully!";
      },
      error: (err) => err.message || "Failed to update admin",
    });

    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium mr-4 text-sm transition-colors"
      >
        <NotebookPen className="w-4 h-4" />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Admin</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Updating: {admin.email}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  defaultValue={admin.fullName || ""}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
