import { components } from './_generated/api';
import { ProsemirrorSync } from '@convex-dev/prosemirror-sync';
import { Presence } from '@convex-dev/presence';
import { getAuthUserId } from "@convex-dev/auth/server";
import { DataModel, Id } from "./_generated/dataModel";
import { GenericQueryCtx, GenericMutationCtx } from 'convex/server';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);
const presence = new Presence(components.presence);

async function checkPermissions(ctx: GenericQueryCtx<DataModel>, id: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  // Check if user has access to the IEP document
  const iep = await ctx.db.get(id as Id<"ieps">);
  if (!iep) {
    throw new Error("Document not found");
  }
  
  if (iep.createdBy !== userId && !iep.teamMembers.includes(userId)) {
    throw new Error("Access denied");
  }
}

async function checkWritePermissions(ctx: GenericMutationCtx<DataModel>, id: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  // Check if user has access to the IEP document
  const iep = await ctx.db.get(id as Id<"ieps">);
  if (!iep) {
    throw new Error("Document not found");
  }
  
  if (iep.createdBy !== userId && !iep.teamMembers.includes(userId)) {
    throw new Error("Access denied");
  }
}

export const { getSnapshot, submitSnapshot, latestVersion, getSteps, submitSteps } = prosemirrorSync.syncApi<DataModel>({
  checkRead: checkPermissions,
  checkWrite: checkWritePermissions,
  onSnapshot: async (ctx, id, snapshot, version) => {
    // Update the IEP document with the latest content
    const iep = await ctx.db.get(id as Id<"ieps">);
    if (iep) {
      await ctx.db.patch(id as Id<"ieps">, {
        content: {
          ...iep.content,
          collaborativeContent: snapshot,
        },
        lastModifiedBy: await getAuthUserId(ctx) || iep.lastModifiedBy,
      });
    }
  },
});

// Presence functions
export const getUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const heartbeat = mutation({
  args: { roomId: v.string(), userId: v.string(), sessionId: v.string(), interval: v.number() },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    return await presence.heartbeat(ctx, roomId, authUserId, sessionId, interval);
  },
});

export const listPresence = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const presenceList = await presence.list(ctx, roomToken);
    const listWithUserInfo = await Promise.all(
      presenceList.map(async (entry) => {
        const user = await ctx.db.get(entry.userId as Id<"users">);
        if (!user) {
          return entry;
        }
        return {
          ...entry,
          name: user?.name || 'Unknown User',
          image: user?.image,
        };
      })
    );
    return listWithUserInfo;
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
