"use client";

import { useState, useMemo } from "react";
import { Search, X, UploadCloud, Loader2, FileCheck } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { updatePaymentReceipt } from "@/app/actions/payments";
import { useRouter } from "next/navigation";

interface PaymentHistoryItem {
  id: string;
  amount: string;
  method: string;
  receiptUrl: string | null;
  paidAt: string;
}

export function PaymentsTable({
  data,
  children,
}: {
  data: any[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, data]);

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search residents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        {children}
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Resident
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Room
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                Paid
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                Balance
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item) => {
              // Parse balance once to use in conditional styling
              const balanceValue = parseFloat(item.balance);

              return (
                <tr
                  key={item.residentId}
                  className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedResident(item)}
                >
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-500">
                    {item.roomNumber}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    Gh₵{parseFloat(item.totalPaid).toLocaleString()}
                  </td>
                  {/* DYNAMIC BALANCE COLORING */}
                  <td
                    className={`px-6 py-4 text-right font-black ${balanceValue > 0 ? "text-red-600" : "text-slate-900"}`}
                  >
                    Gh₵{balanceValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-3 py-1 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      Manage
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail View */}
      {selectedResident && (
        <div
          className="fixed inset-0 z-100 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedResident(null)}
        >
          <div
            className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  Payment History
                </h3>
                <p className="text-sm font-bold text-slate-500">
                  {selectedResident.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {Array.isArray(selectedResident.paymentHistory) &&
                selectedResident.paymentHistory.map(
                  (payment: PaymentHistoryItem) => (
                    <div
                      key={payment.id}
                      className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">
                          Gh₵{parseFloat(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : "N/A"}{" "}
                          • {payment.method}
                        </p>
                      </div>

                      <div className="shrink-0 w-32 flex justify-end">
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 hover:bg-green-100 transition-colors w-fit"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase whitespace-nowrap">
                              View
                            </span>
                          </a>
                        ) : (
                          <UploadButton
                            endpoint="Image"
                            onUploadProgress={() => setIsUpdating(payment.id)}
                            onClientUploadComplete={async (res) => {
                              await updatePaymentReceipt(
                                payment.id,
                                res[0].url,
                              );
                              setIsUpdating(null);
                              router.refresh();
                              const updatedHistory =
                                selectedResident.paymentHistory.map((p: any) =>
                                  p.id === payment.id
                                    ? { ...p, receiptUrl: res[0].url }
                                    : p,
                                );
                              setSelectedResident({
                                ...selectedResident,
                                paymentHistory: updatedHistory,
                              });
                            }}
                            content={{
                              button({ ready }) {
                                if (isUpdating === payment.id)
                                  return (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  );
                                return (
                                  <div className="flex items-center gap-2">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span className="whitespace-nowrap uppercase">
                                      {ready ? "Upload" : "..."}
                                    </span>
                                  </div>
                                );
                              },
                              allowedContent: () => null,
                            }}
                            appearance={{
                              container: "w-fit items-end",
                              button:
                                "h-8 px-3 bg-primary/10 text-primary text-[10px] font-black rounded-xl hover:bg-primary hover:text-white transition-all border-none after:hidden focus-within:ring-0",
                              allowedContent: "hidden",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ),
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
