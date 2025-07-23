import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";

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

  const activeUsers = presenceState?.map((user, index) => ({
    id: user.userId,
    name: user.name || 'Unknown User',
    color: `bg-${['blue', 'green', 'purple', 'orange', 'pink'][index % 5]}-500`,
    initials: (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
  })) || [];

  if (!userId || activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-blue-900">
          {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} editing
        </span>
      </div>
      
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className={`w-8 h-8 ${user.color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
            title={user.name}
          >
            {user.initials}
          </div>
        ))}
        {activeUsers.length > 3 && (
          <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white flex items-center justify-center text-slate-600 text-xs font-medium">
            +{activeUsers.length - 3}
          </div>
        )}
      </div>
      
      <div className="text-xs text-blue-700">
        {activeUsers.map(user => user.name).join(", ")}
      </div>
    </div>
  );
}
