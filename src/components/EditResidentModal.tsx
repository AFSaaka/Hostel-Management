"use client";

import { useState, useMemo } from "react";
import { X, Loader2, Save, User, Phone, Home } from "lucide-react";
import { updateResident } from "@/app/actions/residents";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner"; // 1. Import toast

interface Room {
  id: string;
  roomNumber: string;
  annualPrice: string;
  capacity: number;
  residentsCount: number;
}

interface Resident {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  roomId: string;
  annualCharge: string;
}

export function EditResidentModal({
  resident,
  rooms,
  onClose,
}: {
  resident: Resident;
  rooms: Room[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Removed local error state

  const [photoUrl, setPhotoUrl] = useState<string | null>(
    resident.photoUrl || null,
  );
  const [selectedRoomId, setSelectedRoomId] = useState(resident.roomId);
  const [annualCharge, setAnnualCharge] = useState(resident.annualCharge);

  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (room.id === resident.roomId) return true;
      const capacity = room.capacity ?? 0;
      const current = room.residentsCount ?? 0;
      if (capacity === 0) return false;
      return current < capacity;
    });
  }, [rooms, resident.roomId]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom) {
      setAnnualCharge(selectedRoom.annualPrice);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUploading) {
      toast.warning("Please wait for photo upload to finish");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("photoUrl", photoUrl || "null");
    formData.set("roomId", selectedRoomId);
    formData.set("annualCharge", annualCharge);

    // 2. Use toast.promise for the update action
    toast.promise(updateResident(formData, resident.id), {
      loading: `Updating ${resident.name}'s profile...`,
      success: (result: any) => {
        if (!result.success) throw new Error(result.error || "Update failed");
        onClose();
        return "Profile updated successfully!";
      },
      error: (err) => err.message || "Failed to update resident",
    });

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Edit Resident Profile
            </h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              Update Details & Occupancy
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Picture Zone */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Profile Photo
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="h-20 w-20 rounded-2xl bg-white overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="absolute inset-0 bg-red-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <UploadDropzone
                  endpoint="Image"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setPhotoUrl(res[0].url);
                    setIsUploading(false);
                    toast.success("New photo uploaded!");
                  }}
                  onUploadError={(err: Error) => {
                    setIsUploading(false);
                    toast.error(`Upload failed: ${err.message}`);
                  }}
                  appearance={{
                    container:
                      "border-2 border-dashed border-slate-200 bg-white rounded-xl p-2 min-h-[80px] h-auto w-full flex flex-col items-center justify-center transition-all",
                    label:
                      "text-primary text-[10px] font-bold uppercase tracking-tight mb-1",
                    allowedContent: "hidden",
                    button:
                      "bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg font-bold mt-1",
                    uploadIcon: "w-5 h-5 text-slate-300",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                name="name"
                defaultValue={resident.name}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="phone"
                  defaultValue={resident.phone}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Assign Room
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  name="roomId"
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber}{" "}
                      {r.id === resident.roomId ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Annual Charge
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₵
                </span>
                <input
                  name="annualCharge"
                  type="number"
                  step="0.01"
                  value={annualCharge}
                  onChange={(e) => setAnnualCharge(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 text-sm transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={loading || isUploading}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
