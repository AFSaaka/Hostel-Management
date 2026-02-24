"use client";

import { useState } from "react";
import {
  Search,
  Phone,
  Home,
  User,
  X,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { deleteResident } from "@/app/actions/residents";
import { ConfirmAction } from "@/components/ConfirmAction";
import { EditResidentModal } from "@/components/EditResidentModal";

interface ResidentsTableProps {
  initialData: any[];
  isSuperadmin: boolean;
  allRooms: any[];
}

export function ResidentsTable({
  initialData,
  isSuperadmin,
  allRooms,
}: ResidentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const filteredResidents = initialData.filter(
    (res) =>
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Resident
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Room
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Payment Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredResidents.map((res) => {
              const balance = parseFloat(res.balance || "0");
              const isCleared = balance <= 0;
              return (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => setSelectedResident(res)}
                      >
                        {res.photoUrl ? (
                          <img
                            src={res.photoUrl}
                            className="h-full w-full object-cover"
                            alt={res.name}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {res.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {res.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700">
                        Room {res.roomNumber || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isCleared ? (
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-lg w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">
                          Cleared
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">
                          Debt: ₵{balance.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedResident(res)}
                        className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors uppercase"
                      >
                        Profile
                      </button>
                      {isSuperadmin && (
                        <ConfirmAction
                          title="Delete Resident?"
                          onConfirm={async () => {
                            await deleteResident(res.id);
                          }}
                          actionTrigger={
                            <button className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Profile Slide-over */}
      {selectedResident && !isEditing && (
        <div
          className="fixed inset-0 z-100 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedResident(null)}
        >
          <div
            className="bg-white h-full w-full max-w-sm shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900">Resident Profile</h3>
              <button
                onClick={() => setSelectedResident(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Photo Section */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50">
                  {selectedResident.photoUrl ? (
                    <img
                      src={selectedResident.photoUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-4 text-slate-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {selectedResident.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Room {selectedResident.roomNumber}
                  </p>
                </div>
              </div>

              {/* Financial Section - Only visible if there is a debt */}
              {parseFloat(selectedResident.balance || "0") > 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Wallet className="w-3 h-3" /> Arrears
                  </h4>
                  <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-slate-200">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Balance Due
                      </p>
                      <p className="text-xl font-black">
                        Gh₵
                        {parseFloat(
                          selectedResident.balance || "0",
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-24 space-y-1.5">
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                        <span>Paid</span>
                        <span>
                          {Math.round(
                            (parseFloat(selectedResident.totalPaid || "0") /
                              parseFloat(
                                selectedResident.annualCharge || "1",
                              )) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (parseFloat(selectedResident.totalPaid || "0") / parseFloat(selectedResident.annualCharge || "1")) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History & Receipts */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1 flex justify-between items-center">
                  Receipts <Receipt className="w-3 h-3" />
                </h4>
                <div className="space-y-2">
                  {selectedResident.paymentHistory &&
                  selectedResident.paymentHistory.length > 0 ? (
                    selectedResident.paymentHistory.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            Gh₵{parseFloat(p.amount).toLocaleString()}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {new Date(p.createdAt).toLocaleDateString()} •{" "}
                            {p.method}
                          </p>
                        </div>
                        {p.receiptUrl && (
                          <button
                            onClick={() => setViewingReceipt(p.receiptUrl)}
                            className="p-2 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-600 hover:text-primary transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase italic">
                      No history available
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 bg-white border border-secondary text-slate-900 rounded-xl font-bold hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT LIGHTBOX */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-w-2xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="max-h-[75vh] w-auto rounded-2xl shadow-2xl border-4 border-white/10"
            />
            <a
              href={viewingReceipt}
              target="_blank"
              className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all shadow-xl"
            >
              <ExternalLink className="w-4 h-4" /> Open Full Image
            </a>
          </div>
        </div>
      )}

      {isEditing && selectedResident && (
        <EditResidentModal
          resident={selectedResident}
          rooms={allRooms.map((room) => ({
            ...room,
            residentsCount: initialData.filter((r) => r.roomId === room.id)
              .length,
          }))}
          onClose={() => {
            setIsEditing(false);
            setSelectedResident(null);
          }}
        />
      )}
    </div>
  );
}
