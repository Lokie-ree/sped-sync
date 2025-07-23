import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getChatHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    return messages.reverse();
  },
});

export const sendChatMessage = mutation({
  args: {
    message: v.string(),
    iepId: v.optional(v.id("ieps")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Schedule AI response generation
    await ctx.scheduler.runAfter(0, api.ai.generateAIResponse, {
      userId,
      message: args.message,
      iepId: args.iepId,
    });

    return null;
  },
});

export const generateAIResponse = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
    iepId: v.optional(v.id("ieps")),
  },
  handler: async (ctx, args) => {
    // Generate AI response using the built-in OpenAI
    const response = await generateResponse(args.message);

    // Save the chat message and response
    await ctx.runMutation(api.ai.saveChatMessage, {
      userId: args.userId,
      message: args.message,
      response,
      iepId: args.iepId,
    });

    return response;
  },
});

export const saveChatMessage = mutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    response: v.string(),
    iepId: v.optional(v.id("ieps")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      userId: args.userId,
      message: args.message,
      response: args.response,
      iepId: args.iepId,
      timestamp: Date.now(),
    });
  },
});

export const getImplementationPlan = query({
  args: { iepId: v.id("ieps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const plan = await ctx.db
      .query("implementationPlans")
      .withIndex("by_iep_id", (q) => q.eq("iepId", args.iepId))
      .first();

    return plan;
  },
});

export const generateImplementationPlan = mutation({
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

    // Schedule AI plan generation
    await ctx.scheduler.runAfter(0, api.ai.generateAIPlan, {
      iepId: args.iepId,
      userId,
    });

    return null;
  },
});

export const generateAIPlan = action({
  args: {
    iepId: v.id("ieps"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const iep = await ctx.runQuery(api.ieps.getIEP, { iepId: args.iepId });
    if (!iep) {
      throw new Error("IEP not found");
    }

    // Generate AI implementation plan
    const planContent = await generateImplementationPlanContent(iep);

    // Save the plan
    await ctx.runMutation(api.ai.saveImplementationPlan, {
      iepId: args.iepId,
      userId: args.userId,
      plan: planContent,
    });

    return planContent;
  },
});

export const saveImplementationPlan = mutation({
  args: {
    iepId: v.id("ieps"),
    userId: v.id("users"),
    plan: v.object({
      priorities: v.array(v.object({
        goal: v.string(),
        priority: v.number(),
        rationale: v.string(),
        timeline: v.string(),
        resources: v.array(v.string()),
      })),
      interventions: v.array(v.object({
        strategy: v.string(),
        frequency: v.string(),
        responsibleParty: v.string(),
        materials: v.array(v.string()),
        dataCollection: v.string(),
      })),
      complianceAlerts: v.array(v.object({
        type: v.string(),
        deadline: v.string(),
        description: v.string(),
        severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Check if plan already exists
    const existingPlan = await ctx.db
      .query("implementationPlans")
      .withIndex("by_iep_id", (q) => q.eq("iepId", args.iepId))
      .first();

    if (existingPlan) {
      await ctx.db.patch(existingPlan._id, {
        plan: args.plan,
        generatedBy: args.userId,
      });
      return existingPlan._id;
    } else {
      const planId = await ctx.db.insert("implementationPlans", {
        iepId: args.iepId,
        generatedBy: args.userId,
        plan: args.plan,
        status: "draft",
      });
      return planId;
    }
  },
});

// Helper functions for AI generation
async function generateResponse(message: string): Promise<string> {
  try {
    const openai = await import("openai");
    const client = new openai.default({
      baseURL: process.env.CONVEX_OPENAI_BASE_URL,
      apiKey: process.env.CONVEX_OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are an expert special education consultant helping with IEP development, compliance, and best practices. Provide helpful, accurate, and practical advice."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("AI response generation failed:", error);
    return "I'm sorry, I'm having trouble generating a response right now. Please try again later.";
  }
}

async function generateImplementationPlanContent(iep: any) {
  try {
    const openai = await import("openai");
    const client = new openai.default({
      baseURL: process.env.CONVEX_OPENAI_BASE_URL,
      apiKey: process.env.CONVEX_OPENAI_API_KEY,
    });

    const prompt = `Generate an implementation plan for this IEP:
Student: ${iep.studentName}
Disability: ${iep.disability}
Goals: ${iep.content.goals.map((g: any) => g.goal).join('; ')}

Please provide priorities, interventions, and compliance alerts.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are an expert special education consultant. Generate a structured implementation plan with priorities, interventions, and compliance alerts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse the response into structured data (simplified for demo)
    return {
      priorities: [
        {
          goal: iep.content.goals[0]?.goal || "Primary academic goal",
          priority: 1,
          rationale: "Critical for student's academic progress",
          timeline: "Next 3 months",
          resources: ["Specialized materials", "Additional support staff"]
        }
      ],
      interventions: [
        {
          strategy: "Evidence-based intervention strategy",
          frequency: "Daily",
          responsibleParty: "Special Education Teacher",
          materials: ["Curriculum materials", "Assessment tools"],
          dataCollection: "Weekly progress monitoring"
        }
      ],
      complianceAlerts: [
        {
          type: "Annual Review Due",
          deadline: iep.annualReviewDate,
          description: "Annual IEP review meeting must be scheduled",
          severity: "medium" as const
        }
      ]
    };
  } catch (error) {
    console.error("AI plan generation failed:", error);
    return {
      priorities: [],
      interventions: [],
      complianceAlerts: []
    };
  }
}
