import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAttachment = mutation({
  args: {
    iepId: v.id("ieps"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    category: v.union(
      v.literal("assessment"),
      v.literal("report"),
      v.literal("evaluation"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const attachmentId = await ctx.db.insert("attachments", {
      iepId: args.iepId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      uploadedBy: userId,
      category: args.category,
      description: args.description,
    });

    return attachmentId;
  },
});

export const getAttachments = query({
  args: { iepId: v.optional(v.id("ieps")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let attachments;
    if (args.iepId) {
      const iepId = args.iepId;
      attachments = await ctx.db
        .query("attachments")
        .withIndex("by_iep_id", (q) => q.eq("iepId", iepId))
        .collect();
    } else {
      // Get all attachments for user's IEPs
      const userIEPs = await ctx.db
        .query("ieps")
        .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
        .collect();
      
      const iepIds = userIEPs.map(iep => iep._id);
      attachments = [];
      
      for (const iepId of iepIds) {
        const iepAttachments = await ctx.db
          .query("attachments")
          .withIndex("by_iep_id", (q) => q.eq("iepId", iepId))
          .collect();
        attachments.push(...iepAttachments);
      }
    }

    // Get file URLs
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        url: await ctx.storage.getUrl(attachment.storageId),
      }))
    );

    return attachmentsWithUrls;
  },
});

export const deleteAttachment = mutation({
  args: { attachmentId: v.id("attachments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    // Check if user has permission to delete
    if (attachment.uploadedBy !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.attachmentId);
    await ctx.storage.delete(attachment.storageId);

    return args.attachmentId;
  },
});
