import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface CollaborationIndicatorProps {
  iepId: string;
}

export function CollaborationIndicator({ iepId }: CollaborationIndicatorProps) {
  const userId = useQuery(api.prosemirror.getUserId);
  const presenceState = usePresence(
    {
      heartbeat: api.prosemirror.heartbeat,
      list: api.prosemirror.listPresence,
      disconnect: api.prosemirror.disconnect,
    },
    `iep-${iepId}`,
    userId || "",
    10000
  );

  const activeUsers =
    presenceState?.map((user, index) => ({
      id: user.userId,
      name: user.name || "Unknown User",
      initials: (user.name || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    })) || [];

  if (!userId || activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <Badge
          variant="secondary"
          className="text-blue-900 bg-blue-100 border-blue-200"
        >
          {activeUsers.length} user{activeUsers.length !== 1 ? "s" : ""} editing
        </Badge>
      </div>

      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user) => (
          <Avatar
            key={user.id}
            className="w-8 h-8 border-2 border-white"
            title={user.name}
          >
            <AvatarFallback className="text-xs font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        ))}
        {activeUsers.length > 3 && (
          <Avatar className="w-8 h-8 border-2 border-white">
            <AvatarFallback className="bg-slate-300 text-slate-600 text-xs font-medium">
              +{activeUsers.length - 3}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="text-xs text-blue-700">
        {activeUsers.map((user) => user.name).join(", ")}
      </div>
    </div>
  );
}
