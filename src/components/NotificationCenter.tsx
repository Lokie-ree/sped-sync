import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 10,
  });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsRead);
  const checkCompliance = useMutation(api.notifications.checkComplianceAlerts);

  const handleMarkAsRead = async (notificationId: any) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleCheckCompliance = async () => {
    try {
      await checkCompliance();
      toast.success("Compliance check completed");
    } catch (error) {
      toast.error("Failed to check compliance");
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "outline";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "iep_due":
        return "📅";
      case "meeting_reminder":
        return "🤝";
      case "goal_update":
        return "🎯";
      case "team_invitation":
        return "👥";
      case "compliance_alert":
        return "⚠️";
      case "system_update":
        return "🔔";
      default:
        return "📢";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM11 19H7a2 2 0 01-2-2V7a2 2 0 012-2h4m0 14v-2.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
        </svg>
        {(unreadCount || 0) > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount! > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCheckCompliance}
                  variant="ghost"
                  size="sm"
                >
                  Check Compliance
                </Button>
                {(unreadCount || 0) > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="ghost"
                    size="sm"
                  >
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 rounded-xl transition-colors cursor-pointer ${
                      notification.read
                        ? "bg-slate-50 hover:bg-slate-100"
                        : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                    }`}
                    onClick={() =>
                      !notification.read && handleMarkAsRead(notification._id)
                    }
                  >
                    <div className="flex items-start space-x-3">
                      <div className="shrink-0 text-lg">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 truncate">
                            {notification.title}
                          </p>
                          <Badge
                            variant={
                              getPriorityVariant(notification.priority) as any
                            }
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(
                            notification._creationTime
                          ).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5v-5zM11 19H7a2 2 0 01-2-2V7a2 2 0 012-2h4m0 14v-2.5"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Notifications
                </h3>
                <p className="text-slate-600">You're all caught up!</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

export function NotificationBadge() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
