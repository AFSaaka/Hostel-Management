"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom"; // Added for consistency
import {
  X,
  Loader2,
  Wallet,
  CreditCard,
  StickyNote,
  CheckCircle2,
} from "lucide-react";
import { recordPayment } from "@/app/actions/payments";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";

interface ResidentFinancial {
  residentId: string;
  occupancyId: string;
  name: string;
  roomNumber: string;
  balance: string;
}

export function RecordPaymentModal({
  residents,
}: {
  residents: ResidentFinancial[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const selectedResident = useMemo(
    () => residents.find((r) => r.residentId === selectedId),
    [selectedId, residents],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUploading) {
      toast.warning("Receipt is still uploading...");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (selectedResident)
      formData.append("occupancyId", selectedResident.occupancyId);
    if (receiptUrl) formData.append("receiptUrl", receiptUrl);

    toast.promise(recordPayment(formData), {
      loading: `Processing payment for ${selectedResident?.name}...`,
      success: (result: any) => {
        if (!result.success)
          throw new Error(result.error || "Transaction failed");
        setIsOpen(false);
        resetForm();
        return `Payment of Gh₵${parseFloat(amount).toLocaleString()} posted!`;
      },
      error: (err) => err.message || "Failed to post payment",
      finally: () => setLoading(false),
    });
  }

  function resetForm() {
    setAmount("");
    setSelectedId("");
    setReceiptUrl(null);
  }

  // --- Modal UI wrapped in Portal ---
  const modalContent = (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              New Transaction
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Receive Resident Funds
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5">
          {/* Resident Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Resident
            </label>
            <select
              required
              name="residentId"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setReceiptUrl(null);
              }}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer transition-all"
            >
              <option value="">Select a resident...</option>
              {residents.map((r) => (
                <option key={r.residentId} value={r.residentId}>
                  {r.name} (Room {r.roomNumber})
                </option>
              ))}
            </select>
          </div>

          {selectedResident && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* COMPACT BALANCE INDICATOR */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-xl text-white">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Amount Owed
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      Gh₵{parseFloat(selectedResident.balance).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight">
                    Room {selectedResident.roomNumber}
                  </span>
                </div>
              </div>

              {/* COMPACT UPLOAD AREA */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Payment Proof
                </label>
                {receiptUrl ? (
                  <div className="flex items-center gap-3 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-3 w-full rounded-2xl border border-emerald-100 justify-center animate-in zoom-in-95">
                    <CheckCircle2 className="w-5 h-5" />
                    Receipt Attached
                    <button
                      type="button"
                      onClick={() => setReceiptUrl(null)}
                      className="ml-auto p-1 hover:bg-emerald-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="Image"
                    onUploadProgress={() => setIsUploading(true)}
                    onClientUploadComplete={(res: any) => {
                      setReceiptUrl(res[0].url);
                      setIsUploading(false);
                      toast.success("Receipt uploaded");
                    }}
                    onUploadError={() => {
                      toast.error("Upload failed");
                      setIsUploading(false);
                    }}
                    content={{
                      label: "Attach Receipt",
                      button: ({ ready }) =>
                        isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : ready ? (
                          "Upload File" // Updated text
                        ) : (
                          "Loading..."
                        ),
                    }}
                    appearance={{
                      container:
                        "w-full border-2 border-dashed border-slate-200 bg-slate-50/50 py-2 px-4 mt-0 cursor-pointer hover:border-primary/50 transition-all rounded-2xl flex-row gap-4 min-h-[60px]", // Reduced padding and min-height
                      label: "text-[11px] font-black text-slate-500 uppercase",
                      button:
                        "mt-0 bg-slate-900 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-xl hover:bg-slate-800 transition-all h-auto w-auto shrink-0",
                      allowedContent: "hidden",
                      uploadIcon: "hidden", // Hiding icon to make it even smaller
                    }}
                  />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Amount (Gh₵)
              </label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="number"
                  step="0.01"
                  name="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Method
              </label>
              <select
                required
                name="method"
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              >
                <option value="cash">Cash</option>
                <option value="momo">MoMo</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Note / Reference
            </label>
            <div className="relative">
              <StickyNote className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <textarea
                name="note"
                rows={2}
                placeholder="Transaction ID or details..."
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              />
            </div>
          </div>

          <input type="hidden" name="year" value={new Date().getFullYear()} />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-red-500 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading || isUploading || !selectedId || !amount}
              type="submit"
              className="flex-2 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-20 flex items-center justify-center gap-2 shadow-2xl shadow-slate-300"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Post Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-200 text-sm group"
      >
        <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Record Payment
      </button>
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
