"use client";

import { useState, useMemo } from "react";
import { Search, ImageIcon, Users } from "lucide-react";
import { RoomActions } from "@/components/RoomActions";
import { RoomGallery } from "@/components/RoomGallery";

interface RoomGridClientProps {
  initialRooms: any[];
  isSuperadmin: boolean;
}

export default function RoomGridClient({
  initialRooms,
  isSuperadmin,
}: RoomGridClientProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room: any) => {
      const matchesSearch = room.roomNumber
        .toLowerCase()
        .includes(search.toLowerCase());
      const isFull = room.activeResidents >= room.capacity;

      if (filter === "vacant") return matchesSearch && !isFull;
      if (filter === "full") return matchesSearch && isFull;
      return matchesSearch;
    });
  }, [search, filter, initialRooms]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search room number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "vacant", "full"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room: any) => {
            const isFull = room.activeResidents >= room.capacity;
            const ratio = `${room.activeResidents}/${room.capacity}`;

            return (
              <div
                key={room.id}
                className="bg-white rounded-[1.1rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-44 overflow-hidden rounded-t-[1.1rem]">
                  {room.imageUrls?.length > 0 ? (
                    <RoomGallery images={room.imageUrls} />
                  ) : (
                    <div className="h-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter z-10 shadow-sm backdrop-blur-md pointer-events-none ${
                      isFull
                        ? "bg-red-500/90 text-white"
                        : "bg-emerald-500/90 text-white"
                    }`}
                  >
                    {isFull ? "Full House" : "Vacant Room"}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Room {room.roomNumber}
                    </h3>
                    <RoomActions room={room} isSuperadmin={isSuperadmin} />
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4 min-h-2.5rem">
                    {room.description ||
                      "No description provided for this room."}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                      <span>Live Occupancy</span>
                      <span
                        className={isFull ? "text-red-600" : "text-slate-900"}
                      >
                        {ratio}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          isFull ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${(room.activeResidents / room.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="bg-slate-100 p-1.5 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-tight text-slate-600">
                        {room.capacity} Total Beds
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Annual
                      </span>
                      <div className="text-slate-900 font-black text-lg leading-none mt-1">
                        ₵{parseFloat(room.annualPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-bold">No rooms found</h3>
          <p className="text-slate-400 text-sm mt-1">
            Try adjusting your search for "{search}"
          </p>
        </div>
      )}
    </div>
  );
}
