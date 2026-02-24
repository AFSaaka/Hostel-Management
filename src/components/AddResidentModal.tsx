"use client";

import { useState, useMemo } from "react";
import { X, Loader2, User, Phone, Home } from "lucide-react";
import { createResident } from "@/app/actions/residents";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner"; // 1. Import toast

interface Room {
  id: string;
  roomNumber: string;
  annualPrice: string;
  capacity: number;
  residentsCount: number;
}

interface AddResidentModalProps {
  rooms: Room[];
}

export function AddResidentModal({ rooms }: AddResidentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // error state removed in favor of Sonner

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");

  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      const capacity = room.capacity ?? 0;
      const current = room.residentsCount ?? 0;
      return current < capacity;
    });
  }, [rooms]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setSuggestedPrice(room.annualPrice.toString());
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUploading) {
      toast.warning("Please wait for the photo upload to complete");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("photoUrl", photoUrl || "null");
    const formElement = e.currentTarget;

    // 2. Wrap the server action in a promise toast
    toast.promise(createResident(formData), {
      loading: "Registering resident...",
      success: (result: any) => {
        if (!result.success)
          throw new Error(result.error || "Failed to register");

        setIsOpen(false);
        setPhotoUrl("");
        setSelectedRoomId("");
        setSuggestedPrice("");
        formElement.reset();
        return "Resident registered successfully!";
      },
      error: (err) => err.message || "A critical error occurred",
    });

    setLoading(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-all font-bold shadow-sm text-sm"
      >
        <User className="w-4 h-4" /> Register Resident
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Register Resident
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              New Enrollment Details
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Photo Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Resident Photo
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="h-20 w-20 rounded-2xl bg-white overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
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
              <div className="flex-1">
                <UploadDropzone
                  endpoint="Image"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setPhotoUrl(res[0].url);
                    setIsUploading(false);
                    toast.success("Photo uploaded!");
                  }}
                  onUploadError={(err: Error) => {
                    setIsUploading(false);
                    toast.error(`Upload failed: ${err.message}`);
                  }}
                  appearance={{
                    container:
                      "border-2 border-dashed border-slate-200 bg-white rounded-xl p-2 min-h-[80px] h-auto w-full",
                    label: "text-primary text-[10px] font-bold uppercase",
                    allowedContent: "hidden",
                    button:
                      "bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg font-bold",
                    uploadIcon: "w-5 h-5 text-slate-300",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="phone"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Assign Room
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  name="roomId"
                  required
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} (
                      {room.capacity - room.residentsCount} left)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Annual Charge (₵)
              </label>
              <input
                required
                type="number"
                step="0.01"
                name="annualCharge"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              disabled={loading || isUploading}
              type="submit"
              className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isUploading ? (
                "Uploading..."
              ) : (
                "Complete Registration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
