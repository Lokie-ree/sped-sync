import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const createUserProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("special_educator"),
      v.literal("general_educator"),
      v.literal("service_provider"),
      v.literal("administrator"),
      v.literal("parent"),
      v.literal("student")
    ),
    organization: v.optional(v.string()),
    specialization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      email: user.email || "",
      organization: args.organization,
      specialization: args.specialization,
    });

    return profileId;
  },
});
