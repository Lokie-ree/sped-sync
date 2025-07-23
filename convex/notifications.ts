import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
        readAt: Date.now(),
      });
    }
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unreadNotifications.length;
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("iep_due"),
      v.literal("meeting_reminder"),
      v.literal("goal_update"),
      v.literal("team_invitation"),
      v.literal("compliance_alert"),
      v.literal("system_update")
    ),
    title: v.string(),
    message: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    relatedId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      priority: args.priority,
      relatedId: args.relatedId,
      actionUrl: args.actionUrl,
      read: false,
    });
  },
});

export const checkComplianceAlerts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get all IEPs user has access to
    const allIEPs = await ctx.db.query("ieps").collect();
    const ieps = allIEPs.filter(iep => 
      iep.createdBy === userId || iep.teamMembers.includes(userId)
    );

    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

    for (const iep of ieps) {
      const reviewDate = new Date(iep.annualReviewDate).getTime();
      
      // Check for overdue reviews
      if (reviewDate < now && iep.status === "active") {
        await ctx.runMutation(internal.notifications.createNotification, {
          userId,
          type: "compliance_alert",
          title: "Overdue IEP Review",
          message: `IEP for ${iep.studentName} is overdue for annual review.`,
          priority: "high",
          relatedId: iep._id,
        });
      }
      // Check for reviews due within 7 days
      else if (reviewDate <= sevenDaysFromNow && reviewDate >= now) {
        await ctx.runMutation(internal.notifications.createNotification, {
          userId,
          type: "iep_due",
          title: "IEP Review Due Soon",
          message: `IEP for ${iep.studentName} is due for review within 7 days.`,
          priority: "high",
          relatedId: iep._id,
        });
      }
      // Check for reviews due within 30 days
      else if (reviewDate <= thirtyDaysFromNow && reviewDate >= sevenDaysFromNow) {
        await ctx.runMutation(internal.notifications.createNotification, {
          userId,
          type: "iep_due",
          title: "Upcoming IEP Review",
          message: `IEP for ${iep.studentName} is due for review within 30 days.`,
          priority: "medium",
          relatedId: iep._id,
        });
      }

      // Check for goals with no progress updates in 30 days
      const progressData = await ctx.db
        .query("progressData")
        .withIndex("by_iep_and_goal", (q) => q.eq("iepId", iep._id))
        .filter((q) => q.gte(q.field("_creationTime"), now - (30 * 24 * 60 * 60 * 1000)))
        .collect();

      const goalsWithRecentProgress = new Set(progressData.map(p => p.goalId));
      
      for (const goal of iep.content.goals) {
        if (!goalsWithRecentProgress.has(goal.id)) {
          await ctx.runMutation(internal.notifications.createNotification, {
            userId,
            type: "goal_update",
            title: "Goal Progress Update Needed",
            message: `Goal "${goal.area}" for ${iep.studentName} hasn't been updated in 30 days.`,
            priority: "medium",
            relatedId: iep._id,
          });
        }
      }
    }
  },
});

export const sendMeetingReminder = mutation({
  args: {
    iepId: v.id("ieps"),
    meetingDate: v.string(),
    reminderDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const iep = await ctx.db.get(args.iepId);
    if (!iep) {
      throw new Error("IEP not found");
    }

    // Send reminder to all team members
    for (const memberId of iep.teamMembers) {
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: memberId,
        type: "meeting_reminder",
        title: "IEP Meeting Reminder",
        message: `IEP meeting for ${iep.studentName} is scheduled for ${args.meetingDate}.`,
        priority: "medium",
        relatedId: args.iepId,
      });
    }

    // Also notify the creator if not in team members
    if (!iep.teamMembers.includes(iep.createdBy)) {
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: iep.createdBy,
        type: "meeting_reminder",
        title: "IEP Meeting Reminder",
        message: `IEP meeting for ${iep.studentName} is scheduled for ${args.meetingDate}.`,
        priority: "medium",
        relatedId: args.iepId,
      });
    }
  },
});
