"use client";

import { useState } from "react";
import { Trash2, NotebookPen } from "lucide-react";
import { ConfirmAction } from "./ConfirmAction";
import { deleteRoom } from "@/app/actions/rooms";
import { EditRoomModal } from "./EditRoomModal";

interface RoomActionsProps {
  room: any;
  isSuperadmin: boolean; // Added prop for role-based access
}

export function RoomActions({ room, isSuperadmin }: RoomActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Edit Trigger - Visible to Admins/Superadmins */}
      <button
        onClick={() => setIsEditOpen(true)}
        className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium text-sm p-1 rounded hover:bg-primary/5 transition-colors"
      >
        <NotebookPen className="w-4 h-4" />
      </button>

      {/* Delete Trigger - Strictly restricted to Superadmins */}
      {isSuperadmin && (
        <ConfirmAction
          title={`Delete Room ${room.roomNumber}?`}
          onConfirm={async () => {
            return await deleteRoom(room.id);
          }}
          actionTrigger={
            <button
              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
              title="Delete Room"
            >
              {isSuperadmin && <Trash2 className="w-4 h-4" />}
            </button>
          }
        />
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
