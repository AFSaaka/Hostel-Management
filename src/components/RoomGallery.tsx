"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Image from "next/image";

interface RoomGalleryProps {
  images: string[];
}

export function RoomGallery({ images }: RoomGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure portal target is available (client-side only)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll to prevent dashboard background movement
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  if (!images || images.length === 0) return null;

  const closeModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage(null);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage((prev) =>
      prev !== null && prev < images.length - 1 ? prev + 1 : 0,
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage((prev) =>
      prev !== null && prev > 0 ? prev - 1 : images.length - 1,
    );
  };

  // --- Lightbox Portal Component ---
  const lightboxOverlay = (
    <div
      className="fixed inset-0 z-9999 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
      onClick={closeModal}
    >
      {/* Close Button */}
      <button
        onClick={closeModal}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10000"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-6 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-10000"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-6 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-10000"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div
        className="relative w-[85vw] h-[80vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <Image
            src={images[selectedImage!]}
            alt={`Room image ${selectedImage! + 1}`}
            fill
            className="object-contain rounded-lg"
            priority
            unoptimized // Bypass local optimization to prevent 500 timeouts
          />
        </div>

        {/* Counter */}
        <div className="absolute -bottom-10 left-0 right-0 text-center text-white/50 text-sm font-medium tracking-widest uppercase">
          Image {selectedImage! + 1} of {images.length}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Gallery Thumbnail */}
      <div className="relative h-full w-full group overflow-hidden bg-slate-100">
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={() => setSelectedImage(0)}
        >
          <Image
            src={images[0]}
            alt="Room preview"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            unoptimized
          />
        </div>

        {/* Multi-image Badge */}
        {images.length > 1 && (
          <div
            onClick={() => setSelectedImage(0)}
            className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-2 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer hover:bg-black transition-colors z-10 shadow-lg border border-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="tracking-tighter">+{images.length - 1} MORE</span>
          </div>
        )}
      </div>

      {/* Portal Lightbox: Renders at the end of <body> to avoid card-hover flickering */}
      {selectedImage !== null &&
        mounted &&
        createPortal(lightboxOverlay, document.body)}
    </>
  );
}
