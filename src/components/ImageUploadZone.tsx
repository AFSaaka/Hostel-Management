"use client";

import { X, ImageIcon } from "lucide-react";
// Change: Import the generated component from your utils
import { UploadDropzone } from "@/lib/uploadthing";

interface ImageUploadZoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploadZone({ value, onChange }: ImageUploadZoneProps) {
  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Room Gallery
      </label>

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group shadow-sm"
            >
              <img
                src={url}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                alt="Room preview"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Change: Removed the <OurFileRouter> generic 
        because it is already baked into the component via generateUploadDropzone
      */}
      <UploadDropzone
        endpoint="Image"
        onClientUploadComplete={(res) => {
          const newUrls = res.map((f) => f.url);
          onChange([...value, ...newUrls]);
        }}
        onUploadError={(error: Error) => {
          alert(`Upload error: ${error.message}`);
        }}
        appearance={{
          container:
            "border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-all rounded-xl p-8 cursor-pointer",
          label: "text-primary font-semibold hover:text-primary/80",
          allowedContent:
            "text-slate-400 text-[10px] font-medium mt-1 uppercase tracking-tight",
          button:
            "bg-primary text-white text-xs px-6 py-2 rounded-lg font-bold shadow-md ut-uploading:bg-slate-400",
        }}
        content={{
          label: "Drop room photos here or click to browse",
        }}
      />
    </div>
  );
}
