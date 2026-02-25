"use client";

import { useState } from "react";
import { Trash2, NotebookPen, Info } from "lucide-react";
import { ConfirmAction } from "./ConfirmAction";
import { deleteRoom } from "@/app/actions/rooms";
import { EditRoomModal } from "./EditRoomModal";

interface RoomActionsProps {
  room: any;
  isSuperadmin: boolean;
  canDelete: boolean; // 🚀 New prop passed from RoomGridClient
}

export function RoomActions({
  room,
  isSuperadmin,
  canDelete,
}: RoomActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Edit Trigger */}
      <button
        onClick={() => setIsEditOpen(true)}
        className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium text-sm p-1 rounded hover:bg-primary/5 transition-colors"
      >
        <NotebookPen className="w-4 h-4" />
      </button>

      {/* Delete Trigger - Restricted to Superadmins AND Rooms with 0 Residents */}
      {isSuperadmin && (
        <div className="relative group/tooltip">
          <ConfirmAction
            title={`Delete Room ${room.roomNumber}?`}
            onConfirm={async () => {
              // Extra safety check before calling the action
              if (!canDelete) return;
              return await deleteRoom(room.id);
            }}
            actionTrigger={
              <button
                disabled={!canDelete} // 🚀 Disables the button visually and functionally
                className={`transition-colors p-1 rounded ${
                  canDelete
                    ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                    : "text-slate-200 cursor-not-allowed"
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            }
          />

          {/* 🚀 Tooltip to explain why delete is disabled */}
          {!canDelete && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap z-50">
              <Info className="w-3 h-3 text-amber-400" />
              Remove residents before deleting
            </div>
          )}
        </div>
      )}

      {isEditOpen && (
        <EditRoomModal
          room={room}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
