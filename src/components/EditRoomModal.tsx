"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Added for flickering fix
import { X, Loader2, Bed, Hash, DollarSign, AlignLeft } from "lucide-react";
import { updateRoom } from "@/app/actions/rooms";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";

interface EditRoomModalProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditRoomModal({ room, isOpen, onClose }: EditRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState<string[]>(room.imageUrls || []);

  // Ensure portal target is available on the client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUploading) {
      toast.warning("Please wait for image uploads to complete");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("imageUrls", images.join(","));

    toast.promise(updateRoom(room.id, formData), {
      loading: `Updating Room ${room.roomNumber}...`,
      success: (result: any) => {
        if (!result.success)
          throw new Error(result.error || "Failed to update");
        onClose();
        return "Room updated successfully!";
      },
      error: (err) => err.message || "An unexpected error occurred",
      finally: () => setLoading(false),
    });
  }

  // Define the Modal UI
  const modalContent = (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Edit Room {room.roomNumber}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Management Console
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Room Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="roomNumber"
                  defaultValue={room.roomNumber}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Capacity
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="number"
                  min="1"
                  name="capacity"
                  defaultValue={room.capacity}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Annual Price (₵)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="number"
                step="0.01"
                name="annualPrice"
                defaultValue={room.annualPrice}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Room Gallery
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                  >
                    <img
                      src={url}
                      alt=""
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== idx))
                      }
                      className="absolute inset-0 bg-red-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <UploadDropzone
              endpoint="Image"
              onUploadBegin={() => setIsUploading(true)}
              onClientUploadComplete={(res) => {
                const urls = res.map((f: any) => f.url);
                setImages((prev) => [...prev, ...urls]);
                setIsUploading(false);
                toast.success("Images added to gallery");
              }}
              onUploadError={(err: Error) => {
                setIsUploading(false);
                toast.error(`Upload failed: ${err.message}`);
              }}
              appearance={{
                container:
                  "border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-4 cursor-pointer transition-all min-h-[120px]",
                label: "text-primary text-[10px] font-bold uppercase",
                allowedContent: "hidden",
                button:
                  "bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg font-bold mt-2",
                uploadIcon: "w-8 h-8 text-slate-300",
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Description
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                name="description"
                rows={2}
                defaultValue={room.description}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={loading || isUploading}
              type="submit"
              className="flex-1 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isUploading ? (
                "Uploading..."
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
