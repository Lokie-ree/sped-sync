import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserIEPs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const ieps = await ctx.db
      .query("ieps")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    return ieps;
  },
});

export const getIEP = query({
  args: { iepId: v.id("ieps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const iep = await ctx.db.get(args.iepId);
    if (!iep) {
      throw new Error("IEP not found");
    }

    // Check if user has access to this IEP
    if (iep.createdBy !== userId && !iep.teamMembers.includes(userId)) {
      throw new Error("Access denied");
    }

    return iep;
  },
});

export const createIEP = mutation({
  args: {
    studentName: v.string(),
    studentId: v.string(),
    grade: v.string(),
    dateOfBirth: v.string(),
    disability: v.string(),
    meetingDate: v.string(),
    annualReviewDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const iepId = await ctx.db.insert("ieps", {
      studentName: args.studentName,
      studentId: args.studentId,
      grade: args.grade,
      dateOfBirth: args.dateOfBirth,
      disability: args.disability,
      status: "draft",
      meetingDate: args.meetingDate,
      annualReviewDate: args.annualReviewDate,
      createdBy: userId,
      lastModifiedBy: userId,
      content: {
        presentLevels: "",
        goals: [],
        services: [],
        accommodations: [],
        modifications: [],
      },
      teamMembers: [userId],
      approvals: [],
    });

    return iepId;
  },
});

export const updateIEP = mutation({
  args: {
    iepId: v.id("ieps"),
    updates: v.object({
      studentName: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("draft"),
        v.literal("in_review"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("expired")
      )),
      content: v.optional(v.object({
        presentLevels: v.optional(v.string()),
        goals: v.optional(v.array(v.object({
          id: v.string(),
          area: v.string(),
          goal: v.string(),
          objectives: v.array(v.string()),
          measurableOutcomes: v.string(),
          timeline: v.string(),
          responsibleParty: v.string(),
          progress: v.number(),
        }))),
        services: v.optional(v.array(v.object({
          type: v.string(),
          frequency: v.string(),
          duration: v.string(),
          location: v.string(),
          provider: v.string(),
        }))),
        accommodations: v.optional(v.array(v.string())),
        modifications: v.optional(v.array(v.string())),
        transitionPlanning: v.optional(v.string()),
      })),
    }),
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

    // Check if user has access to edit this IEP
    if (iep.createdBy !== userId && !iep.teamMembers.includes(userId)) {
      throw new Error("Access denied");
    }

    const updateData: any = {
      lastModifiedBy: userId,
    };
    
    if (args.updates.studentName !== undefined) {
      updateData.studentName = args.updates.studentName;
    }
    if (args.updates.status !== undefined) {
      updateData.status = args.updates.status;
    }
    if (args.updates.content !== undefined) {
      updateData.content = {
        ...iep.content,
        ...args.updates.content,
      };
    }

    await ctx.db.patch(args.iepId, updateData);

    return args.iepId;
  },
});
