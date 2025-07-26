# Convex Data Schema and Query Patterns

## Convex Database Architecture Overview

The Special Education Management System utilizes Convex's document-based database architecture to provide real-time synchronization and serverless scalability. Convex stores data as documents within collections, enabling flexible schema evolution while maintaining strong consistency and real-time updates across all connected clients.

The system implements educational data privacy requirements through Convex's built-in authentication and authorization patterns. All personally identifiable information receives appropriate protection through Convex's security model, ensuring compliance with Family Educational Rights and Privacy Act requirements and state educational privacy regulations.

## Core Document Collections

### Users Collection

The users collection maintains comprehensive information about all system participants, including educators, administrators, service providers, and family members. Convex handles user authentication through the better-auth integration, providing secure session management and role-based access control.

```typescript
// convex/schema.ts
users: defineTable({
  email: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("teacher"),
    v.literal("specialist"),
    v.literal("parent"),
    v.literal("student")
  ),
  phoneNumber: v.optional(v.string()),
  organizationId: v.id("organizations"),
  isActive: v.boolean(),
  lastLogin: v.optional(v.number()),
  profileImage: v.optional(v.string()),
  preferences: v.optional(
    v.object({
      notifications: v.boolean(),
      theme: v.string(),
      language: v.string(),
    })
  ),
})
  .index("by_email", ["email"])
  .index("by_organization", ["organizationId"])
  .index("by_role", ["role"]);
```

The users collection establishes relationships with other entities through Convex's document reference patterns. Each user maintains organizational affiliations and role assignments that determine data access permissions throughout the system.

### Students Collection

The students collection stores comprehensive student profiles with educational history, disability classifications, and current service requirements. Convex's document structure accommodates the complex data relationships inherent in special education management while maintaining query performance and real-time synchronization.

```typescript
// convex/schema.ts
students: defineTable({
  firstName: v.string(),
  lastName: v.string(),
  dateOfBirth: v.string(), // ISO date string, encrypted at application level
  studentNumber: v.string(),
  gradeLevel: v.string(),
  primaryDisability: v.string(),
  secondaryDisabilities: v.optional(v.array(v.string())),
  caseManagerId: v.id("users"),
  enrollmentStatus: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("graduated"),
    v.literal("transferred")
  ),
  iepStatus: v.union(
    v.literal("active"),
    v.literal("pending"),
    v.literal("expired"),
    v.literal("not_applicable")
  ),
  emergencyContacts: v.array(
    v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
    })
  ),
  medicalConsiderations: v.optional(v.string()),
  transportationNeeds: v.optional(v.string()),
})
  .index("by_case_manager", ["caseManagerId"])
  .index("by_student_number", ["studentNumber"])
  .index("by_grade", ["gradeLevel"])
  .index("by_status", ["enrollmentStatus", "iepStatus"]);
```

The students collection implements privacy protection through application-level encryption for sensitive data fields. Convex queries filter student access based on user roles and team member assignments, ensuring appropriate data visibility for each system participant.

### IEP Documents Collection

The ieps collection manages Individualized Education Program documents with comprehensive versioning and approval workflows. Convex's real-time capabilities enable collaborative IEP development with multiple team members contributing simultaneously while maintaining document integrity.

```typescript
// convex/schema.ts
ieps: defineTable({
  studentId: v.id("students"),
  effectiveDate: v.string(), // ISO date string
  expirationDate: v.string(),
  meetingDate: v.string(),
  nextReviewDate: v.string(),
  placement: v.string(),
  serviceHours: v.object({
    specialEducation: v.number(),
    speechTherapy: v.optional(v.number()),
    occupationalTherapy: v.optional(v.number()),
    physicalTherapy: v.optional(v.number()),
    counseling: v.optional(v.number()),
    other: v.optional(
      v.array(
        v.object({
          service: v.string(),
          hours: v.number(),
        })
      )
    ),
  }),
  accommodations: v.array(
    v.object({
      category: v.string(),
      description: v.string(),
      setting: v.string(),
    })
  ),
  modifications: v.array(
    v.object({
      subject: v.string(),
      description: v.string(),
      criteria: v.string(),
    })
  ),
  transitionPlan: v.optional(
    v.object({
      postSecondaryGoals: v.array(v.string()),
      transitionServices: v.array(v.string()),
      agencyInvolvement: v.optional(v.array(v.string())),
    })
  ),
  status: v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("expired"),
    v.literal("superseded")
  ),
  version: v.number(),
  createdBy: v.id("users"),
  teamMembers: v.array(v.id("users")),
  approvals: v.array(
    v.object({
      userId: v.id("users"),
      role: v.string(),
      approvedAt: v.number(),
      signature: v.string(),
    })
  ),
})
  .index("by_student", ["studentId"])
  .index("by_status", ["status"])
  .index("by_effective_date", ["effectiveDate"])
  .index("by_team_member", ["teamMembers"]);
```

The IEP document structure supports complex approval workflows and team collaboration patterns. Convex's optimistic updates enable real-time collaborative editing while maintaining data consistency through conflict resolution mechanisms.

### Goals Collection

The goals collection represents individual IEP goals with measurable objectives and progress tracking capabilities. Convex enables real-time progress monitoring with immediate data synchronization across all team members working with specific students.

```typescript
// convex/schema.ts
goals: defineTable({
  iepId: v.id("ieps"),
  goalNumber: v.number(),
  domain: v.union(
    v.literal("academic"),
    v.literal("behavioral"),
    v.literal("communication"),
    v.literal("social"),
    v.literal("motor"),
    v.literal("adaptive"),
    v.literal("vocational")
  ),
  description: v.string(),
  baselineData: v.object({
    measurement: v.string(),
    date: v.string(),
    value: v.number(),
    context: v.string(),
  }),
  targetCriteria: v.object({
    measurement: v.string(),
    target: v.number(),
    timeframe: v.string(),
    accuracy: v.string(),
    conditions: v.string(),
  }),
  evaluationMethod: v.string(),
  frequency: v.string(),
  responsibleProvider: v.id("users"),
  isActive: v.boolean(),
  masteryDate: v.optional(v.string()),
  notes: v.optional(v.string()),
})
  .index("by_iep", ["iepId"])
  .index("by_domain", ["domain"])
  .index("by_provider", ["responsibleProvider"])
  .index("by_status", ["isActive"]);
```

Goals maintain direct relationships with progress data points through Convex queries that aggregate measurement data for trend analysis and reporting. The real-time nature of Convex enables immediate feedback when progress data is entered.

### Progress Data Collection

The progressData collection captures individual progress monitoring observations with real-time synchronization for immediate feedback and analysis. Convex aggregation functions provide statistical analysis and trend identification for educational decision-making.

```typescript
// convex/schema.ts
progressData: defineTable({
  goalId: v.id("goals"),
  recordedDate: v.string(), // ISO date string
  recordedBy: v.id("users"),
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
  settingType: v.string(),
  promptLevel: v.optional(v.string()),
  independenceLevel: v.string(),
})
  .index("by_goal", ["goalId"])
  .index("by_date", ["recordedDate"])
  .index("by_recorder", ["recordedBy"])
  .index("by_mastery", ["masteryLevel"]);
```

Progress data collection supports complex aggregation queries for trend analysis and goal mastery determination. Convex's real-time capabilities ensure immediate data availability for educational decision-making and family communication.

### Documents Collection

The documents collection manages file uploads and document storage with metadata tracking and access control. Convex integrates with external storage providers while maintaining document references and permission management within the database.

```typescript
// convex/schema.ts
documents: defineTable({
  studentId: v.id("students"),
  documentType: v.union(
    v.literal("assessment"),
    v.literal("iep"),
    v.literal("progress_report"),
    v.literal("communication"),
    v.literal("medical"),
    v.literal("behavioral"),
    v.literal("other")
  ),
  title: v.string(),
  description: v.optional(v.string()),
  fileUrl: v.string(), // Reference to external storage
  fileSize: v.number(),
  mimeType: v.string(),
  uploadedBy: v.id("users"),
  isConfidential: v.boolean(),
  accessPermissions: v.array(
    v.object({
      userId: v.id("users"),
      permission: v.union(
        v.literal("view"),
        v.literal("edit"),
        v.literal("download")
      ),
    })
  ),
  tags: v.optional(v.array(v.string())),
  relatedIepId: v.optional(v.id("ieps")),
  relatedGoalId: v.optional(v.id("goals")),
})
  .index("by_student", ["studentId"])
  .index("by_type", ["documentType"])
  .index("by_uploader", ["uploadedBy"])
  .index("by_confidentiality", ["isConfidential"]);
```

Document management integrates with Convex file storage patterns while maintaining granular access control and audit trails. The system supports document relationships with IEPs and goals for comprehensive record management.

### Organizations Collection

The organizations collection represents educational institutions with configuration settings and administrative hierarchies. Convex enables multi-tenant architecture with organization-specific customizations and data isolation.

```typescript
// convex/schema.ts
organizations: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("school"),
    v.literal("district"),
    v.literal("agency")
  ),
  address: v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
  }),
  contactInfo: v.object({
    phone: v.string(),
    email: v.string(),
    website: v.optional(v.string()),
  }),
  settings: v.object({
    timezone: v.string(),
    academicYear: v.object({
      start: v.string(),
      end: v.string(),
    }),
    gradeSystem: v.array(v.string()),
    reportingPeriods: v.array(v.string()),
    complianceSettings: v.object({
      iepReviewCycle: v.number(),
      evaluationCycle: v.number(),
      transitionAge: v.number(),
    }),
  }),
  isActive: v.boolean(),
  subscriptionTier: v.union(
    v.literal("basic"),
    v.literal("professional"),
    v.literal("enterprise")
  ),
  maxUsers: v.number(),
  maxStudents: v.number(),
})
  .index("by_type", ["type"])
  .index("by_subscription", ["subscriptionTier"]);
```

Organizations provide configuration context for all other collections through Convex queries that filter data based on organizational relationships and access permissions.

## Convex Query Patterns

### Authentication Queries

Convex authentication patterns integrate with better-auth to provide secure user session management and role-based access control. Authentication queries validate user permissions before executing data operations.

```typescript
// convex/users.ts
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .unique();
  },
});

export const getUsersByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
    if (!user || user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized access");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
```

### Student Data Queries

Student data queries implement privacy protection through role-based filtering and team member validation. Convex queries ensure users access only students within their authorization scope.

```typescript
// convex/students.ts
export const getStudentsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    if (user.role === "admin") {
      return await ctx.db
        .query("students")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", user.organizationId)
        )
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
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // Verify user has access to this student
    const hasAccess = await verifyStudentAccess(ctx, user._id, student._id);
    if (!hasAccess) throw new Error("Access denied");

    return student;
  },
});
```

### IEP Management Queries

IEP queries support collaborative document development with real-time synchronization and version control. Convex enables multiple team members to work on IEP documents simultaneously while maintaining data consistency.

```typescript
// convex/ieps.ts
export const getActiveIEP = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    const hasAccess = await verifyStudentAccess(ctx, user._id, args.studentId);
    if (!hasAccess) throw new Error("Access denied");

    return await ctx.db
      .query("ieps")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();
  },
});

export const getIEPWithGoals = query({
  args: { iepId: v.id("ieps") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    const iep = await ctx.db.get(args.iepId);
    if (!iep) return null;

    const hasAccess = await verifyStudentAccess(ctx, user._id, iep.studentId);
    if (!hasAccess) throw new Error("Access denied");

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_iep", (q) => q.eq("iepId", args.iepId))
      .collect();

    return { ...iep, goals };
  },
});
```

### Progress Monitoring Queries

Progress monitoring queries provide real-time data aggregation and trend analysis for educational decision-making. Convex aggregation functions calculate statistical measures and identify progress patterns.

```typescript
// convex/progress.ts
export const getGoalProgress = query({
  args: {
    goalId: v.id("goals"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) return null;

    const iep = await ctx.db.get(goal.iepId);
    if (!iep) return null;

    const hasAccess = await verifyStudentAccess(ctx, user._id, iep.studentId);
    if (!hasAccess) throw new Error("Access denied");

    let query = ctx.db
      .query("progressData")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId));

    if (args.startDate) {
      query = query.filter((q) =>
        q.gte(q.field("recordedDate"), args.startDate!)
      );
    }

    if (args.endDate) {
      query = query.filter((q) =>
        q.lte(q.field("recordedDate"), args.endDate!)
      );
    }

    const progressData = await query.collect();

    // Calculate trend analysis
    const trendAnalysis = calculateProgressTrend(
      progressData,
      goal.targetCriteria
    );

    return {
      goal,
      progressData,
      trendAnalysis,
      summary: {
        totalDataPoints: progressData.length,
        latestMeasurement: progressData[progressData.length - 1],
        progressToTarget: calculateProgressPercentage(
          progressData,
          goal.targetCriteria
        ),
      },
    };
  },
});
```

## Real-time Collaboration Patterns

### Collaborative Text Editor Integration

Convex Components provide real-time collaborative text editing capabilities for IEP document development. The system maintains document state consistency while supporting multiple concurrent editors.

```typescript
// convex/collaboration.ts
export const getDocumentEditors = query({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    // Get active editing sessions for this document
    return await ctx.db
      .query("editingSessions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.gt(q.field("lastActivity"), Date.now() - 30000)) // Active in last 30 seconds
      .collect();
  },
});

export const updateDocumentPresence = mutation({
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
    const user = await getCurrentUser(ctx, {});
    if (!user) throw new Error("Authentication required");

    // Update or create editing session
    const existingSession = await ctx.db
      .query("editingSessions")
      .withIndex("by_user_document", (q) =>
        q.eq("userId", user._id).eq("documentId", args.documentId)
      )
      .unique();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastActivity: Date.now(),
      });
    } else {
      await ctx.db.insert("editingSessions", {
        userId: user._id,
        documentId: args.documentId,
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastActivity: Date.now(),
      });
    }
  },
});
```

### Data Validation and Integrity

Convex mutations implement comprehensive data validation to ensure educational compliance and data integrity. Validation patterns enforce business rules specific to special education requirements.

```typescript
// convex/mutations.ts
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
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, {});
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

    if (existingIEP) {
      // Mark existing IEP as superseded
      await ctx.db.patch(existingIEP._id, { status: "superseded" });
    }

    // Create new IEP
    const iepId = await ctx.db.insert("ieps", {
      ...args,
      status: "draft",
      version: existingIEP ? existingIEP.version + 1 : 1,
      createdBy: user._id,
      teamMembers: [user._id],
      accommodations: [],
      modifications: [],
      approvals: [],
    });

    return iepId;
  },
});
```

This Convex-based data architecture provides the foundation for real-time collaboration, secure data access, and educational compliance while maintaining the flexibility to evolve with changing requirements.
