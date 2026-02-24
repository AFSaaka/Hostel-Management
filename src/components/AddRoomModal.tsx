"use client";

import { useState } from "react";
import { X, Loader2, Bed, Hash, DollarSign, AlignLeft } from "lucide-react";
import { createRoom } from "@/app/actions/rooms";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner"; // 1. Import toast

export function AddRoomModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Removed local error state - Sonner will handle it
  const [images, setImages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUploading) {
      toast.warning("Please wait for images to finish uploading");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("imageUrls", images.join(","));
    const formElement = e.currentTarget;

    // 2. Wrap the server action in a promise toast
    toast.promise(createRoom(formData), {
      loading: "Saving room details to database...",
      success: (result: any) => {
        if (!result.success)
          throw new Error(result.error || "Failed to create room");

        // Cleanup UI
        setIsOpen(false);
        setImages([]);
        formElement.reset();
        return `Room ${formData.get("roomNumber")} created successfully!`;
      },
      error: (err) =>
        err.message || "Something went wrong while saving the room",
    });

    setLoading(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-primary-hover/90 transition-all font-semibold shadow-sm"
      >
        <Bed className="w-5 h-5" />
        Add New Room
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Room</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Expand Hostel Capacity
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Details Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Room Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="roomNumber"
                  placeholder="101"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Capacity
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="number"
                  min="1"
                  name="capacity"
                  placeholder="4"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Annual Price (₵)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="number"
                step="0.01"
                name="annualPrice"
                placeholder="5500.00"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Compact Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Room Photos
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group"
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <UploadDropzone
              endpoint="Image"
              onUploadBegin={() => setIsUploading(true)}
              onClientUploadComplete={(res) => {
                const urls = res.map((f) => f.ufsUrl);
                setImages((prev) => [...prev, ...urls]);
                setIsUploading(false);
                toast.success(`${res.length} images uploaded!`); // Feedback on upload success
              }}
              onUploadError={(error: Error) => {
                setIsUploading(false);
                toast.error(`Upload failed: ${error.message}`); // Replaced alert with toast
              }}
              appearance={{
                container:
                  "border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl p-2 cursor-pointer transition-all min-h-[120px] h-[120px]",
                label: "text-primary text-xs font-semibold",
                allowedContent: "text-slate-400 text-[10px] mt-0",
                button:
                  "bg-primary text-white text-[10px] px-3 py-1 rounded-md mt-1 ut-readying:bg-slate-400 ut-uploading:bg-slate-400",
                uploadIcon: "w-8 h-8 text-slate-300",
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Description
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                name="description"
                rows={2}
                placeholder="Spacious room with pool view..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 resize-none text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={loading || isUploading}
              type="submit"
              className="flex-1 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isUploading ? (
                "Uploading..."
              ) : (
                "Create Room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
