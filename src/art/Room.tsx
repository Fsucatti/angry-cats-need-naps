import type { ReactNode } from "react";
import type { Room as RoomName } from "../economy/player";
import { t } from "../i18n";

export function Room({ room, level, children }: { room: RoomName; level: number; children?: ReactNode }) {
  return (
    <div className="room-art">
      <img src={`/art/rooms/${room}-${level}.png`} alt={t(`room.${room}`)} loading="lazy" draggable={false} />
      <div className="room-cats">{children}</div>
    </div>
  );
}
