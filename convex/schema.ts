import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with role-based permissions
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("special_educator"),
      v.literal("general_educator"), 
      v.literal("service_provider"),
      v.literal("administrator"),
      v.literal("parent"),
      v.literal("student")
    ),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    organization: v.optional(v.string()),
    specialization: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  // IEP documents
  ieps: defineTable({
    studentName: v.string(),
    studentId: v.string(),
    grade: v.string(),
    dateOfBirth: v.string(),
    disability: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("expired")
    ),
    meetingDate: v.string(),
    annualReviewDate: v.string(),
    createdBy: v.id("users"),
    lastModifiedBy: v.id("users"),
    content: v.object({
      presentLevels: v.string(),
      goals: v.array(v.object({
        id: v.string(),
        area: v.string(),
        goal: v.string(),
        objectives: v.array(v.string()),
        measurableOutcomes: v.string(),
        timeline: v.string(),
        responsibleParty: v.string(),
        progress: v.number(),
      })),
      services: v.array(v.object({
        type: v.string(),
        frequency: v.string(),
        duration: v.string(),
        location: v.string(),
        provider: v.string(),
      })),
      accommodations: v.array(v.string()),
      modifications: v.array(v.string()),
      transitionPlanning: v.optional(v.string()),
      collaborativeContent: v.optional(v.string()),
    }),
    teamMembers: v.array(v.id("users")),
    approvals: v.array(v.object({
      userId: v.id("users"),
      role: v.string(),
      approved: v.boolean(),
      signedAt: v.optional(v.number()),
      signature: v.optional(v.string()),
    })),
  }).index("by_student_id", ["studentId"])
    .index("by_created_by", ["createdBy"])
    .index("by_status", ["status"]),

  // Real-time collaboration sessions
  collaborationSessions: defineTable({
    iepId: v.id("ieps"),
    activeUsers: v.array(v.object({
      userId: v.id("users"),
      cursor: v.optional(v.object({
        line: v.number(),
        column: v.number(),
      })),
      selection: v.optional(v.object({
        start: v.object({ line: v.number(), column: v.number() }),
        end: v.object({ line: v.number(), column: v.number() }),
      })),
      lastSeen: v.number(),
    })),
    changes: v.array(v.object({
      userId: v.id("users"),
      timestamp: v.number(),
      operation: v.string(),
      content: v.string(),
      position: v.object({
        line: v.number(),
        column: v.number(),
      }),
    })),
  }).index("by_iep_id", ["iepId"]),

  // File attachments
  attachments: defineTable({
    iepId: v.id("ieps"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    category: v.union(
      v.literal("assessment"),
      v.literal("report"),
      v.literal("evaluation"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  }).index("by_iep_id", ["iepId"]),

  // Progress monitoring data
  progressData: defineTable({
    iepId: v.id("ieps"),
    goalId: v.string(),
    dataPoint: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
    recordedBy: v.id("users"),
    interventionUsed: v.optional(v.string()),
  }).index("by_iep_and_goal", ["iepId", "goalId"])
    .index("by_date", ["date"]),

  // AI-generated implementation plans
  implementationPlans: defineTable({
    iepId: v.id("ieps"),
    generatedBy: v.id("users"),
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
    status: v.union(v.literal("draft"), v.literal("approved"), v.literal("implemented")),
  }).index("by_iep_id", ["iepId"]),

  // Chat messages for AI assistant
  chatMessages: defineTable({
    userId: v.id("users"),
    iepId: v.optional(v.id("ieps")),
    message: v.string(),
    response: v.string(),
    context: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_iep_id", ["iepId"]),

  // Document chunks for RAG search
  documentChunks: defineTable({
    sourceId: v.string(), // IEP ID or attachment ID
    sourceType: v.union(v.literal("iep"), v.literal("attachment")),
    content: v.string(),
    metadata: v.object({
      title: v.string(),
      section: v.optional(v.string()),
      studentName: v.optional(v.string()),
      chunkIndex: v.number(),
    }),
    embedding: v.optional(v.array(v.number())),
  }).index("by_source", ["sourceId", "sourceType"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["sourceType", "sourceId"],
    }),

  // Notifications system
  notifications: defineTable({
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
    read: v.boolean(),
    readAt: v.optional(v.number()),
    relatedId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  }).index("by_user_id", ["userId"])
    .index("by_read_status", ["userId", "read"]),

  // Analytics and reporting
  reports: defineTable({
    userId: v.id("users"),
    reportType: v.union(
      v.literal("summary"),
      v.literal("compliance"),
      v.literal("progress"),
      v.literal("detailed")
    ),
    timeRange: v.string(),
    filters: v.object({
      status: v.optional(v.string()),
      disability: v.optional(v.string()),
      grade: v.optional(v.string()),
    }),
    data: v.any(), // Store the analytics data
    status: v.union(v.literal("generating"), v.literal("generated"), v.literal("failed")),
  }).index("by_user_id", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
