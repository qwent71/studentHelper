import Image from "next/image";
import type { User } from "../model/types";

export function UserBadge({ user }: { user: Pick<User, "name" | "image"> }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name}
          width={32}
          height={32}
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
          {initials}
        </div>
      )}
      <span className="text-sm font-medium">{user.name}</span>
    </div>
  );
}
