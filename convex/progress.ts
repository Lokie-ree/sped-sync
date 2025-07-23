import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAllProgressData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all IEPs the user has access to
    const userIEPs = await ctx.db
      .query("ieps")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    const iepIds = userIEPs.map(iep => iep._id);
    
    // Get progress data for those IEPs
    const progressData = [];
    for (const iepId of iepIds) {
      const data = await ctx.db
        .query("progressData")
        .withIndex("by_iep_and_goal", (q) => q.eq("iepId", iepId))
        .collect();
      progressData.push(...data);
    }

    return progressData;
  },
});

export const addProgressData = mutation({
  args: {
    iepId: v.id("ieps"),
    goalId: v.string(),
    dataPoint: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
    interventionUsed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const progressId = await ctx.db.insert("progressData", {
      iepId: args.iepId,
      goalId: args.goalId,
      dataPoint: args.dataPoint,
      date: args.date,
      notes: args.notes,
      recordedBy: userId,
      interventionUsed: args.interventionUsed,
    });

    return progressId;
  },
});

export const getProgressForIEP = query({
  args: { iepId: v.id("ieps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const progressData = await ctx.db
      .query("progressData")
      .withIndex("by_iep_and_goal", (q) => q.eq("iepId", args.iepId))
      .collect();

    return progressData;
  },
});
