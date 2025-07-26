# Convex Functions and Integration Architecture

## Convex Backend Architecture Overview

The Special Education Management System utilizes Convex's function-based architecture, which fundamentally differs from traditional REST APIs by providing reactive, real-time data synchronization with strong consistency guarantees. The system employs three distinct function types—queries, mutations, and actions—each serving specific roles within the educational data management workflow.

Convex's reactive architecture ensures that all connected clients receive immediate updates when educational data changes, enabling real-time collaboration between teachers, specialists, and administrators. The transactional nature of mutations guarantees data integrity for sensitive student information, while the component-based architecture provides modular functionality without sacrificing consistency.

## Function-Based API Design

### Query Functions

Queries provide read-only access to educational data with automatic real-time subscriptions. When educators access student information, IEP documents, or progress data, queries establish reactive connections that deliver immediate updates when underlying data changes.

```typescript
// convex/queries/students.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./auth";

export const getStudentsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    // Filter students based on user role and permissions
    if (user.role === "admin") {
      return await ctx.db
        .query("students")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", user.organizationId)
        )
        .filter((q) => q.eq(q.field("enrollmentStatus"), "active"))
        .collect();
    }

    if (user.role === "teacher" || user.role === "specialist") {
      return await ctx.db
        .query("students")
        .withIndex("by_case_manager", (q) => q.eq("caseManagerId", user._id))
        .collect();
    }

    return [];
  },
});

export const getStudentDetail = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // Verify user has access to this student
    const hasAccess = await verifyStudentAccess(ctx, user._id, student._id);
    if (!hasAccess) throw new Error("Access denied");

    // Get related data
    const activeIEP = await ctx.db
      .query("ieps")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    const teamMembers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), student.caseManagerId))
      .collect();

    return {
      ...student,
      activeIEP,
      teamMembers,
    };
  },
});
```

### Mutation Functions

Mutations handle all write operations with full ACID transactional guarantees. Educational data modifications, IEP updates, and progress tracking entries execute atomically, ensuring data consistency across complex educational workflows.

```typescript
// convex/mutations/ieps.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./auth";

export const createIEP = mutation({
  args: {
    studentId: v.id("students"),
    effectiveDate: v.string(),
    expirationDate: v.string(),
    meetingDate: v.string(),
    placement: v.string(),
    serviceHours: v.object({
      specialEducation: v.number(),
      speechTherapy: v.optional(v.number()),
      occupationalTherapy: v.optional(v.number()),
      physicalTherapy: v.optional(v.number()),
      counseling: v.optional(v.number()),
    }),
    teamMembers: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      throw new Error("Insufficient permissions");
    }

    // Validate dates
    const effective = new Date(args.effectiveDate);
    const expiration = new Date(args.expirationDate);
    const meeting = new Date(args.meetingDate);

    if (expiration <= effective) {
      throw new Error("Expiration date must be after effective date");
    }

    if (meeting > effective) {
      throw new Error("Meeting date cannot be after effective date");
    }

    // Check for existing active IEP
    const existingIEP = await ctx.db
      .query("ieps")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    // Mark existing IEP as superseded within the same transaction
    if (existingIEP) {
      await ctx.db.patch(existingIEP._id, { status: "superseded" });
    }

    // Create new IEP
    const iepId = await ctx.db.insert("ieps", {
      ...args,
      status: "draft",
      version: existingIEP ? existingIEP.version + 1 : 1,
      createdBy: user._id,
      accommodations: [],
      modifications: [],
      approvals: [],
      nextReviewDate: new Date(
        expiration.getTime() - 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    // Create audit log entry
    await ctx.db.insert("auditLogs", {
      entityType: "iep",
      entityId: iepId,
      action: "created",
      userId: user._id,
      timestamp: Date.now(),
      details: {
        studentId: args.studentId,
        version: existingIEP ? existingIEP.version + 1 : 1,
      },
    });

    return iepId;
  },
});

export const updateIEPGoal = mutation({
  args: {
    goalId: v.id("goals"),
    updates: v.object({
      description: v.optional(v.string()),
      targetCriteria: v.optional(
        v.object({
          measurement: v.string(),
          target: v.number(),
          timeframe: v.string(),
          accuracy: v.string(),
          conditions: v.string(),
        })
      ),
      evaluationMethod: v.optional(v.string()),
      frequency: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const iep = await ctx.db.get(goal.iepId);
    if (!iep) throw new Error("Associated IEP not found");

    // Verify user has access to modify this goal
    const hasAccess = await verifyStudentAccess(ctx, user._id, iep.studentId);
    if (!hasAccess) throw new Error("Access denied");

    // Update goal with version tracking
    await ctx.db.patch(args.goalId, {
      ...args.updates,
      lastModified: Date.now(),
      modifiedBy: user._id,
    });

    // Create audit log entry
    await ctx.db.insert("auditLogs", {
      entityType: "goal",
      entityId: args.goalId,
      action: "updated",
      userId: user._id,
      timestamp: Date.now(),
      details: { changes: args.updates, iepId: goal.iepId },
    });

    return args.goalId;
  },
});
```

### Action Functions

Actions handle external service integration and non-deterministic operations while maintaining transactional integrity through internal mutation calls. The system uses actions for AI-powered IEP generation, email notifications, and external API integrations.

```typescript
// convex/actions/ai.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateIEPGoals = action({
  args: {
    studentId: v.id("students"),
    assessmentData: v.object({
      academicPerformance: v.string(),
      currentLevels: v.string(),
      strengths: v.string(),
      needs: v.string(),
    }),
    goalDomains: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Fetch student data through queries
    const student = await ctx.runQuery(
      internal.queries.students.getStudentForAI,
      {
        studentId: args.studentId,
      }
    );

    if (!student) throw new Error("Student not found");

    // Call OpenAI API for goal generation
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert special education consultant. Generate SMART IEP goals based on student assessment data. Goals must be Specific, Measurable, Achievable, Relevant, and Time-bound. Format response as JSON array of goal objects.`,
          },
          {
            role: "user",
            content: `Student: ${student.firstName} ${student.lastName}, Grade: ${student.gradeLevel}, Primary Disability: ${student.primaryDisability}
            
Assessment Data:
- Academic Performance: ${args.assessmentData.academicPerformance}
- Current Levels: ${args.assessmentData.currentLevels}
- Strengths: ${args.assessmentData.strengths}
- Needs: ${args.assessmentData.needs}

Generate goals for domains: ${args.goalDomains.join(", ")}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedGoals = JSON.parse(aiResponse.choices[0].message.content);

    // Save generated goals through mutation
    const savedGoals = await ctx.runMutation(
      internal.mutations.ieps.saveGeneratedGoals,
      {
        studentId: args.studentId,
        goals: generatedGoals,
        generationMetadata: {
          model: "gpt-4",
          timestamp: Date.now(),
          assessmentData: args.assessmentData,
        },
      }
    );

    return {
      goalIds: savedGoals,
      generatedCount: generatedGoals.length,
    };
  },
});

export const sendNotification = action({
  args: {
    recipientIds: v.array(v.id("users")),
    type: v.union(
      v.literal("iep_review_due"),
      v.literal("meeting_scheduled"),
      v.literal("progress_update"),
      v.literal("goal_mastered")
    ),
    subject: v.string(),
    message: v.string(),
    metadata: v.optional(
      v.object({
        studentId: v.optional(v.id("students")),
        iepId: v.optional(v.id("ieps")),
        meetingDate: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get recipient information
    const recipients = await ctx.runQuery(
      internal.queries.users.getNotificationRecipients,
      {
        userIds: args.recipientIds,
      }
    );

    const emailPromises = recipients.map(async (recipient) => {
      if (!recipient.email) return null;

      // Use Resend component for email delivery
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "notifications@spedsystem.edu",
          to: [recipient.email],
          subject: args.subject,
          html: `
            <h2>${args.subject}</h2>
            <p>Dear ${recipient.firstName} ${recipient.lastName},</p>
            <p>${args.message}</p>
            <p>Best regards,<br>Special Education Management System</p>
          `,
        }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send email to ${recipient.email}: ${response.status}`
        );
        return null;
      }

      return await response.json();
    });

    const emailResults = await Promise.allSettled(emailPromises);

    // Log notification delivery through mutation
    await ctx.runMutation(internal.mutations.notifications.logDelivery, {
      type: args.type,
      recipientIds: args.recipientIds,
      subject: args.subject,
      deliveryResults: emailResults.map((result, index) => ({
        recipientId: args.recipientIds[index],
        success: result.status === "fulfilled" && result.value !== null,
        error:
          result.status === "rejected" ? result.reason.toString() : undefined,
      })),
      metadata: args.metadata,
    });

    return {
      sent: emailResults.filter(
        (r) => r.status === "fulfilled" && r.value !== null
      ).length,
      failed: emailResults.filter(
        (r) => r.status === "rejected" || r.value === null
      ).length,
    };
  },
});
```

## Real-Time Collaboration Architecture

### Collaborative Text Editor Integration

The system implements real-time collaborative editing for IEP documents using Convex's reactive capabilities combined with operational transformation for conflict resolution.

```typescript
// convex/mutations/collaboration.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateDocumentContent = mutation({
  args: {
    documentId: v.string(),
    operation: v.object({
      type: v.union(
        v.literal("insert"),
        v.literal("delete"),
        v.literal("retain")
      ),
      position: v.number(),
      content: v.optional(v.string()),
      length: v.optional(v.number()),
      timestamp: v.number(),
      userId: v.id("users"),
    }),
    baseVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    // Get current document state
    const document = await ctx.db
      .query("documents")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .unique();

    if (!document) throw new Error("Document not found");

    // Check for version conflicts
    if (args.baseVersion !== document.version) {
      // Transform operation against concurrent operations
      const concurrentOps = await ctx.db
        .query("documentOperations")
        .withIndex("by_document_version", (q) =>
          q
            .eq("documentId", args.documentId)
            .gte("version", args.baseVersion + 1)
            .lte("version", document.version)
        )
        .collect();

      const transformedOp = transformOperation(args.operation, concurrentOps);
      args.operation = transformedOp;
    }

    // Apply operation to document content
    const newContent = applyOperation(document.content, args.operation);
    const newVersion = document.version + 1;

    // Update document atomically
    await ctx.db.patch(document._id, {
      content: newContent,
      version: newVersion,
      lastModified: Date.now(),
      lastModifiedBy: user._id,
    });

    // Store operation for conflict resolution
    await ctx.db.insert("documentOperations", {
      documentId: args.documentId,
      version: newVersion,
      operation: args.operation,
      userId: user._id,
      timestamp: args.operation.timestamp,
    });

    return {
      version: newVersion,
      content: newContent,
    };
  },
});

export const updateUserPresence = mutation({
  args: {
    documentId: v.string(),
    cursorPosition: v.number(),
    selection: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    // Update or create presence record
    const existingPresence = await ctx.db
      .query("userPresence")
      .withIndex("by_user_document", (q) =>
        q.eq("userId", user._id).eq("documentId", args.documentId)
      )
      .unique();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastActivity: Date.now(),
      });
    } else {
      await ctx.db.insert("userPresence", {
        userId: user._id,
        documentId: args.documentId,
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastActivity: Date.now(),
      });
    }

    return { success: true };
  },
});
```

### Real-Time Progress Monitoring

Progress data entry triggers immediate updates across all connected team members, enabling real-time collaboration during instruction and assessment.

```typescript
// convex/mutations/progress.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordProgressData = mutation({
  args: {
    goalId: v.id("goals"),
    measurementValue: v.number(),
    measurementUnit: v.string(),
    observationNotes: v.optional(v.string()),
    context: v.optional(v.string()),
    masteryLevel: v.union(
      v.literal("emerging"),
      v.literal("developing"),
      v.literal("proficient"),
      v.literal("mastered")
    ),
    sessionDuration: v.optional(v.number()),
    promptLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const iep = await ctx.db.get(goal.iepId);
    if (!iep) throw new Error("Associated IEP not found");

    // Verify user can record progress for this student
    const hasAccess = await verifyStudentAccess(ctx, user._id, iep.studentId);
    if (!hasAccess) throw new Error("Access denied");

    // Record progress data point
    const dataPointId = await ctx.db.insert("progressData", {
      goalId: args.goalId,
      recordedDate: new Date().toISOString().split("T")[0],
      recordedBy: user._id,
      measurementValue: args.measurementValue,
      measurementUnit: args.measurementUnit,
      observationNotes: args.observationNotes,
      context: args.context,
      masteryLevel: args.masteryLevel,
      sessionDuration: args.sessionDuration,
      settingType: "classroom", // Could be parameterized
      promptLevel: args.promptLevel,
      independenceLevel: determineMasteryLevel(args.masteryLevel),
    });

    // Update goal progress summary
    const allProgressData = await ctx.db
      .query("progressData")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    const progressSummary = calculateProgressSummary(
      allProgressData,
      goal.targetCriteria
    );

    await ctx.db.patch(args.goalId, {
      currentProgress: progressSummary.currentLevel,
      progressPercentage: progressSummary.progressPercentage,
      trendDirection: progressSummary.trendDirection,
      lastDataPoint: Date.now(),
    });

    // Check for goal mastery
    if (
      progressSummary.progressPercentage >= 80 &&
      args.masteryLevel === "mastered"
    ) {
      await ctx.db.patch(args.goalId, {
        masteryDate: new Date().toISOString(),
        isActive: false,
      });

      // Trigger mastery notification
      await ctx.scheduler.runAfter(
        0,
        internal.actions.notifications.sendGoalMasteryNotification,
        {
          goalId: args.goalId,
          studentId: iep.studentId,
          achievementDate: new Date().toISOString(),
        }
      );
    }

    return dataPointId;
  },
});
```

## Component Integration Architecture

### Better-Auth Integration

The system integrates better-auth for comprehensive authentication management while maintaining Convex's reactive patterns.

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    GitHub,
    Google,
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if user exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.profile.email))
        .unique();

      if (existingUser) {
        // Update last login
        await ctx.db.patch(existingUser._id, {
          lastLogin: Date.now(),
        });
        return existingUser._id;
      }

      // Create new user with default role
      const userId = await ctx.db.insert("users", {
        email: args.profile.email!,
        firstName: args.profile.name?.split(" ")[0] || "",
        lastName: args.profile.name?.split(" ").slice(1).join(" ") || "",
        role: "parent", // Default role, updated by admin
        isActive: true,
        lastLogin: Date.now(),
        preferences: {
          notifications: true,
          theme: "light",
          language: "en",
        },
      });

      return userId;
    },
  },
});

export const getUserIdentity = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email))
    .unique();
};
```

### Resend Email Component

Integration with Resend for educational communication while maintaining audit trails and delivery tracking.

```typescript
// convex/components/resend.ts
import { defineComponent } from "convex/server";
import { action } from "./_generated/server";
import { v } from "convex/values";

const resendComponent = defineComponent("resend");

export const sendEducationalEmail = resendComponent.action({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    htmlContent: v.string(),
    category: v.union(
      v.literal("iep_notification"),
      v.literal("progress_report"),
      v.literal("meeting_reminder"),
      v.literal("system_alert")
    ),
    studentId: v.optional(v.id("students")),
    attachments: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          content: v.string(), // base64 encoded
          contentType: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "notifications@spedsystem.edu",
        to: args.to,
        subject: args.subject,
        html: args.htmlContent,
        attachments: args.attachments,
        tags: [
          { name: "category", value: args.category },
          { name: "system", value: "sped-management" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status}`);
    }

    const result = await response.json();

    // Log email delivery for compliance
    await ctx.runMutation("internal:mutations.notifications.logEmailDelivery", {
      messageId: result.id,
      recipients: args.to,
      subject: args.subject,
      category: args.category,
      studentId: args.studentId,
      deliveredAt: Date.now(),
    });

    return result;
  },
});
```

### Polar Billing Integration

Subscription and billing management integrated with educational organization structures.

```typescript
// convex/components/polar.ts
import { defineComponent } from "convex/server";
import { action } from "./_generated/server";
import { v } from "convex/values";

const polarComponent = defineComponent("polar");

export const handleSubscriptionWebhook = polarComponent.httpAction({
  handler: async (ctx, request) => {
    const signature = request.headers.get("polar-signature");
    const payload = await request.text();

    // Verify webhook signature
    const isValid = await verifyPolarSignature(payload, signature);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(payload);

    switch (event.type) {
      case "subscription.created":
        await ctx.runMutation("internal:mutations.billing.createSubscription", {
          organizationId: event.data.metadata.organizationId,
          subscriptionId: event.data.id,
          planType: event.data.product.name,
          status: "active",
          currentPeriodStart: new Date(
            event.data.current_period_start
          ).getTime(),
          currentPeriodEnd: new Date(event.data.current_period_end).getTime(),
        });
        break;

      case "subscription.updated":
        await ctx.runMutation("internal:mutations.billing.updateSubscription", {
          subscriptionId: event.data.id,
          status: event.data.status,
          planType: event.data.product.name,
        });
        break;

      case "subscription.cancelled":
        await ctx.runMutation("internal:mutations.billing.cancelSubscription", {
          subscriptionId: event.data.id,
          cancelledAt: Date.now(),
        });
        break;
    }

    return new Response("OK", { status: 200 });
  },
});
```

## File Storage and Document Management

### Secure File Upload Pattern

Educational documents require secure handling with appropriate access controls and audit trails.

```typescript
// convex/mutations/documents.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
    studentId: v.id("students"),
    documentType: v.union(
      v.literal("assessment"),
      v.literal("iep"),
      v.literal("progress_report"),
      v.literal("communication"),
      v.literal("medical"),
      v.literal("behavioral")
    ),
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    // Verify user has access to upload documents for this student
    const hasAccess = await verifyStudentAccess(ctx, user._id, args.studentId);
    if (!hasAccess) throw new Error("Access denied");

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(args.contentType)) {
      throw new Error("File type not allowed");
    }

    if (args.fileSize > 20 * 1024 * 1024) {
      // 20MB limit
      throw new Error("File size exceeds limit");
    }

    // Generate upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();

    // Create pending document record
    const documentId = await ctx.db.insert("documents", {
      studentId: args.studentId,
      documentType: args.documentType,
      title: args.filename,
      fileSize: args.fileSize,
      mimeType: args.contentType,
      uploadedBy: user._id,
      status: "uploading",
      isConfidential: determineConfidentiality(args.documentType),
      accessPermissions: await generateDefaultPermissions(
        ctx,
        args.studentId,
        user._id
      ),
      uploadUrl: uploadUrl,
    });

    return {
      uploadUrl,
      documentId,
    };
  },
});

export const confirmUpload = mutation({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx);
    if (!user) throw new Error("Authentication required");

    const document = await ctx.db.get(args.documentId);
    if (!document || document.uploadedBy !== user._id) {
      throw new Error("Document not found or access denied");
    }

    // Update document with storage reference
    await ctx.db.patch(args.documentId, {
      fileUrl: await ctx.storage.getUrl(args.storageId),
      storageId: args.storageId,
      status: "available",
      uploadedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      entityType: "document",
      entityId: args.documentId,
      action: "uploaded",
      userId: user._id,
      timestamp: Date.now(),
      details: {
        filename: document.title,
        documentType: document.documentType,
        studentId: document.studentId,
      },
    });

    return args.documentId;
  },
});
```

## HTTP Actions for External Integration

### Webhook Endpoints

The system exposes HTTP endpoints for integration with external educational systems and services.

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// SIS Integration Webhook
http.route({
  path: "/webhooks/sis/student-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !verifyWebhookAuth(authHeader)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = await request.json();

    // Process student information updates from SIS
    await ctx.runMutation(internal.mutations.students.updateFromSIS, {
      sisStudentId: payload.student_id,
      updates: {
        gradeLevel: payload.grade_level,
        enrollmentStatus: payload.status,
        demographicData: payload.demographics,
      },
      lastSyncTimestamp: Date.now(),
    });

    return new Response("OK", { status: 200 });
  }),
});

// Assessment Platform Integration
http.route({
  path: "/webhooks/assessment/results",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("X-Assessment-Signature");
    const payload = await request.text();

    if (!verifyAssessmentSignature(payload, signature)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const assessmentData = JSON.parse(payload);

    // Import assessment results
    await ctx.runMutation(internal.mutations.assessments.importResults, {
      studentIdentifier: assessmentData.student_id,
      assessmentType: assessmentData.assessment_type,
      results: assessmentData.results,
      administeredDate: assessmentData.date_administered,
      importSource: "external_platform",
    });

    return new Response("Assessment imported", { status: 200 });
  }),
});

// Parent Portal API
http.route({
  path: "/api/parent/student-progress/:studentId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const studentId = url.pathname.split("/").pop();
    const authToken = url.searchParams.get("token");

    // Validate parent access token
    const parentAccess = await ctx.runQuery(
      internal.queries.auth.validateParentToken,
      {
        token: authToken,
        studentId: studentId,
      }
    );

    if (!parentAccess) {
      return new Response("Access denied", { status: 403 });
    }

    // Get student progress data
    const progressData = await ctx.runQuery(
      internal.queries.progress.getStudentSummary,
      {
        studentId: studentId,
        includeConfidential: false, // Parents get filtered view
      }
    );

    return new Response(JSON.stringify(progressData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://parent-portal.spedsystem.edu",
      },
    });
  }),
});

export default http;
```

## Testing and Development Patterns

### Function Testing Strategy

Convex functions are tested using the convex-test library for isolated unit testing with realistic data scenarios.

```typescript
// convex/test/iep.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

test("IEP creation with goal generation", async () => {
  const t = convexTest(schema);

  // Setup test data
  const userId = await t.db.insert("users", {
    email: "teacher@school.edu",
    firstName: "Jane",
    lastName: "Smith",
    role: "teacher",
    organizationId: await t.db.insert("organizations", {
      name: "Test School District",
      type: "district",
    }),
  });

  const studentId = await t.db.insert("students", {
    firstName: "John",
    lastName: "Doe",
    gradeLevel: "5",
    primaryDisability: "Specific Learning Disability",
    caseManagerId: userId,
    enrollmentStatus: "active",
    iepStatus: "pending",
  });

  // Test IEP creation
  const iepId = await t.mutation(api.mutations.ieps.createIEP, {
    studentId,
    effectiveDate: "2024-01-15",
    expirationDate: "2025-01-14",
    meetingDate: "2024-01-10",
    placement: "General Education with Support",
    serviceHours: {
      specialEducation: 300,
      speechTherapy: 60,
    },
    teamMembers: [userId],
  });

  expect(iepId).toBeDefined();

  // Verify IEP was created correctly
  const iep = await t.db.get(iepId);
  expect(iep?.status).toBe("draft");
  expect(iep?.version).toBe(1);
  expect(iep?.studentId).toBe(studentId);

  // Test goal creation
  const goalId = await t.mutation(api.mutations.goals.createGoal, {
    iepId,
    domain: "academic",
    description: "John will read grade-level text with 90% accuracy",
    baselineData: {
      measurement: "reading accuracy",
      date: "2024-01-05",
      value: 65,
      context: "classroom assessment",
    },
    targetCriteria: {
      measurement: "reading accuracy percentage",
      target: 90,
      timeframe: "by annual review",
      accuracy: "4 out of 5 trials",
      conditions: "when given grade-level text",
    },
    evaluationMethod: "curriculum-based measurement",
    frequency: "weekly",
    responsibleProvider: userId,
  });

  expect(goalId).toBeDefined();

  // Verify goal links to IEP
  const goal = await t.db.get(goalId);
  expect(goal?.iepId).toBe(iepId);
  expect(goal?.isActive).toBe(true);
});
```

## Production Deployment and Monitoring

### Environment Configuration

Production deployments utilize Convex's built-in environment management with educational compliance considerations.

```typescript
// convex.config.ts
import { defineApp } from "convex/server";

const app = defineApp();

app.use(convexAuth);
app.use(resendComponent, {
  apiKey: process.env.RESEND_API_KEY!,
});
app.use(polarComponent, {
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
});

// Environment-specific configurations
app.env({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  ENCRYPTION_KEY: process.env.STUDENT_DATA_ENCRYPTION_KEY!,
  SIS_WEBHOOK_SECRET: process.env.SIS_WEBHOOK_SECRET!,
  ASSESSMENT_PLATFORM_KEY: process.env.ASSESSMENT_PLATFORM_KEY!,
});

export default app;
```

This Convex-based architecture provides the foundation for building a robust, real-time Special Education Management System that maintains educational compliance while enabling modern collaborative workflows. The function-based approach eliminates traditional API complexity while providing stronger consistency guarantees essential for managing sensitive student data.
