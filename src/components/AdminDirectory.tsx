"use client";

import { useState, useEffect } from "react";
import { getAuditLogs, updateAdminRole } from "@/app/actions/settings";
import { Shield, UserMinus, UserPlus, Clock, X, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminDirectory({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getAuditLogs(50);
      setLogs(data);
    } catch (e) {
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin & Activity
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Audit logs and permission management.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Audit Logs Table */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                Recent System Events
              </h3>
            </div>

            <div className="border border-slate-100 rounded-4x1 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-600 divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center text-slate-400"
                      >
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {log.actorId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              log.action === "DELETE"
                                ? "bg-red-100 text-red-600"
                                : log.action === "CREATE"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {log.entityType}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-slate-400 hover:text-slate-900 underline">
                            View JSON
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
