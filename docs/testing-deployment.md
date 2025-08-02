# Convex-Native Testing Strategy and Deployment Framework

## Convex Testing Architecture Overview

The Special Education Management System employs Convex's native testing ecosystem to ensure reliability, security, and compliance with educational regulations. This comprehensive testing strategy utilizes only Convex-provided tools and utilities, eliminating external dependencies while maintaining thorough coverage of educational workflows and data integrity requirements.

Convex's testing architecture provides three distinct testing approaches: mock-based unit testing with `convex-test`, real backend integration testing using the open-source Convex backend, and production-like environment testing through preview deployments. This multi-layered approach ensures comprehensive validation of educational data management, compliance requirements, and collaborative features.

## Unit Testing with convex-test

### Mock Backend Testing Framework

The `convex-test` library provides a JavaScript mock implementation of the Convex backend, enabling rapid automated testing of function logic without external dependencies. This approach excels at testing educational business logic, data validation, and user permission enforcement within isolated test environments.

```typescript
// package.json - Minimal testing dependencies
{
  "scripts": {
    "test": "vitest",
    "test:once": "vitest run",
    "test:debug": "vitest --inspect-brk --no-file-parallelism",
    "test:coverage": "vitest run --coverage --coverage.reporter=text"
  },
  "devDependencies": {
    "convex-test": "latest",
    "vitest": "latest",
    "@edge-runtime/vm": "latest"
  }
}
```

```typescript
// vitest.config.mts - Convex runtime matching configuration
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
```

### Educational Function Testing Patterns

Unit tests validate educational business logic including IEP development workflows, progress monitoring calculations, and compliance requirement enforcement. The mock backend maintains transactional semantics essential for testing complex educational data relationships.

```typescript
// convex/test/iep-workflow.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("IEP Development Workflow", () => {
  test("creates IEP with goals and enforces compliance", async () => {
    const t = convexTest(schema);

    // Setup educational context
    const organizationId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Lincoln Elementary School",
        type: "school",
        address: {
          street: "123 Education Ave",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        contactInfo: {
          phone: "(555) 123-4567",
          email: "admin@lincoln.edu",
        },
        settings: {
          timezone: "America/Chicago",
          academicYear: {
            start: "2024-08-15",
            end: "2025-06-01",
          },
          gradeSystem: ["K", "1", "2", "3", "4", "5"],
          reportingPeriods: ["Q1", "Q2", "Q3", "Q4"],
          complianceSettings: {
            iepReviewCycle: 365,
            evaluationCycle: 1095,
            transitionAge: 16,
          },
        },
        isActive: true,
        subscriptionTier: "professional",
        maxUsers: 50,
        maxStudents: 200,
      });
    });

    const teacherId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "teacher@lincoln.edu",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "teacher",
        phoneNumber: "(555) 234-5678",
        organizationId,
        isActive: true,
        lastLogin: Date.now(),
        preferences: {
          notifications: true,
          theme: "light",
          language: "en",
        },
      });
    });

    const studentId = await t.run(async (ctx) => {
      return await ctx.db.insert("students", {
        firstName: "Alex",
        lastName: "Martinez",
        dateOfBirth: "2015-03-15", // 9 years old
        studentNumber: "STU-2024-001",
        gradeLevel: "3",
        primaryDisability: "Specific Learning Disability",
        secondaryDisabilities: ["ADHD"],
        caseManagerId: teacherId,
        enrollmentStatus: "active",
        iepStatus: "pending",
        emergencyContacts: [
          {
            name: "Maria Martinez",
            relationship: "Mother",
            phone: "(555) 345-6789",
            email: "maria.martinez@email.com",
          },
        ],
        medicalConsiderations: "No known allergies",
        transportationNeeds: "Bus transportation required",
      });
    });

    // Test IEP creation with compliance validation
    const iepId = await t.mutation(api.mutations.ieps.createIEP, {
      studentId,
      effectiveDate: "2024-09-01",
      expirationDate: "2025-08-31",
      meetingDate: "2024-08-25",
      placement: "General Education with Resource Support",
      serviceHours: {
        specialEducation: 150, // minutes per week
        speechTherapy: 30,
        occupationalTherapy: 60,
      },
      teamMembers: [teacherId],
    });

    expect(iepId).toBeDefined();

    // Verify IEP structure and compliance
    const iep = await t.run(async (ctx) => {
      return await ctx.db.get(iepId);
    });

    expect(iep).toMatchObject({
      studentId,
      status: "draft",
      version: 1,
      createdBy: teacherId,
      teamMembers: [teacherId],
    });

    // Test goal creation with measurable criteria
    const readingGoalId = await t.mutation(api.mutations.goals.createGoal, {
      iepId,
      domain: "academic",
      description:
        "Alex will read third-grade level text with 85% accuracy as measured by curriculum-based assessments",
      baselineData: {
        measurement: "reading accuracy percentage",
        date: "2024-08-15",
        value: 65,
        context: "informal reading inventory",
      },
      targetCriteria: {
        measurement: "reading accuracy percentage",
        target: 85,
        timeframe: "by annual review",
        accuracy: "4 out of 5 consecutive sessions",
        conditions: "when given third-grade level text",
      },
      evaluationMethod: "curriculum-based measurement",
      frequency: "weekly",
      responsibleProvider: teacherId,
    });

    expect(readingGoalId).toBeDefined();

    // Verify goal links correctly to IEP
    const goal = await t.run(async (ctx) => {
      return await ctx.db.get(readingGoalId);
    });

    expect(goal).toMatchObject({
      iepId,
      domain: "academic",
      isActive: true,
      responsibleProvider: teacherId,
    });

    // Test progress data recording with trend analysis
    const progressDataId = await t.mutation(
      api.mutations.progress.recordProgressData,
      {
        goalId: readingGoalId,
        measurementValue: 70,
        measurementUnit: "percentage",
        observationNotes: "Student showed improvement with phonetic decoding",
        context: "small group instruction",
        masteryLevel: "developing",
        sessionDuration: 20,
        promptLevel: "moderate prompting",
      }
    );

    expect(progressDataId).toBeDefined();

    // Verify progress tracking updates goal summary
    const updatedGoal = await t.run(async (ctx) => {
      return await ctx.db.get(readingGoalId);
    });

    expect(updatedGoal?.currentProgress).toBe(70);
    expect(updatedGoal?.lastDataPoint).toBeDefined();
  });

  test("enforces FERPA compliance in data access", async () => {
    const t = convexTest(schema);

    // Create two separate organizations
    const org1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "School A",
        type: "school",
        address: {
          street: "123 A St",
          city: "City A",
          state: "IL",
          zipCode: "60601",
          country: "USA",
        },
        contactInfo: { phone: "(555) 111-1111", email: "admin@schoola.edu" },
        settings: {
          timezone: "America/Chicago",
          academicYear: { start: "2024-08-15", end: "2025-06-01" },
          gradeSystem: ["K", "1", "2", "3", "4", "5"],
          reportingPeriods: ["Q1", "Q2", "Q3", "Q4"],
          complianceSettings: {
            iepReviewCycle: 365,
            evaluationCycle: 1095,
            transitionAge: 16,
          },
        },
        isActive: true,
        subscriptionTier: "basic",
        maxUsers: 25,
        maxStudents: 100,
      });
    });

    const org2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "School B",
        type: "school",
        address: {
          street: "456 B St",
          city: "City B",
          state: "IL",
          zipCode: "60602",
          country: "USA",
        },
        contactInfo: { phone: "(555) 222-2222", email: "admin@schoolb.edu" },
        settings: {
          timezone: "America/Chicago",
          academicYear: { start: "2024-08-15", end: "2025-06-01" },
          gradeSystem: ["K", "1", "2", "3", "4", "5"],
          reportingPeriods: ["Q1", "Q2", "Q3", "Q4"],
          complianceSettings: {
            iepReviewCycle: 365,
            evaluationCycle: 1095,
            transitionAge: 16,
          },
        },
        isActive: true,
        subscriptionTier: "basic",
        maxUsers: 25,
        maxStudents: 100,
      });
    });

    // Create teachers in different organizations
    const teacher1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "teacher1@schoola.edu",
        firstName: "Teacher",
        lastName: "One",
        role: "teacher",
        organizationId: org1Id,
        isActive: true,
        lastLogin: Date.now(),
        preferences: { notifications: true, theme: "light", language: "en" },
      });
    });

    const teacher2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "teacher2@schoolb.edu",
        firstName: "Teacher",
        lastName: "Two",
        role: "teacher",
        organizationId: org2Id,
        isActive: true,
        lastLogin: Date.now(),
        preferences: { notifications: true, theme: "light", language: "en" },
      });
    });

    // Create student in org1
    const studentId = await t.run(async (ctx) => {
      return await ctx.db.insert("students", {
        firstName: "Protected",
        lastName: "Student",
        dateOfBirth: "2016-01-01",
        studentNumber: "STU-ORG1-001",
        gradeLevel: "2",
        primaryDisability: "Autism Spectrum Disorder",
        caseManagerId: teacher1Id,
        enrollmentStatus: "active",
        iepStatus: "active",
        emergencyContacts: [
          {
            name: "Parent Name",
            relationship: "Parent",
            phone: "(555) 999-9999",
          },
        ],
      });
    });

    // Teacher from org1 should access their student
    const authorizedAccess = await t.query(
      api.queries.students.getStudentDetail,
      {
        studentId,
      }
    );
    expect(authorizedAccess).toBeDefined();
    expect(authorizedAccess?.firstName).toBe("Protected");

    // Teacher from org2 should NOT access student from org1
    // This should throw an access denied error
    await expect(
      t
        .withIdentity({ tokenIdentifier: "teacher2@schoolb.edu" })
        .query(api.queries.students.getStudentDetail, { studentId })
    ).rejects.toThrow("Access denied");
  });
});
```

### Component Integration Testing

React components that use Convex hooks require specialized testing patterns using the ConvexReactClientFake from convex-helpers, maintaining full Convex integration without external mocking frameworks.

```typescript
// convex/test/progress-monitoring-component.test.ts
import { convexTest } from "convex-test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { ConvexReactClientFake } from "convex-helpers/testing";
import { ConvexProvider } from "convex/react";
import { ProgressMonitoringForm } from "../components/ProgressMonitoringForm";
import { api } from "./_generated/api";
import schema from "./schema";

describe("Progress Monitoring Component", () => {
  test("records progress data with validation", async () => {
    const t = convexTest(schema);

    // Setup test data
    const goalId = await t.run(async (ctx) => {
      const studentId = await ctx.db.insert("students", {
        firstName: "Test",
        lastName: "Student",
        dateOfBirth: "2015-05-01",
        studentNumber: "TEST-001",
        gradeLevel: "3",
        primaryDisability: "Learning Disability",
        caseManagerId: "user_123",
        enrollmentStatus: "active",
        iepStatus: "active",
        emergencyContacts: []
      });

      const iepId = await ctx.db.insert("ieps", {
        studentId,
        effectiveDate: "2024-01-01",
        expirationDate: "2024-12-31",
        meetingDate: "2023-12-15",
        nextReviewDate: "2024-12-01",
        placement: "General Education",
        serviceHours: { specialEducation: 300 },
        accommodations: [],
        modifications: [],
        status: "active",
        version: 1,
        createdBy: "user_123",
        teamMembers: ["user_123"],
        approvals: []
      });

      return await ctx.db.insert("goals", {
        iepId,
        goalNumber: 1,
        domain: "academic",
        description: "Math computation goal",
        baselineData: {
          measurement: "correct responses",
          date: "2024-01-01",
          value: 60,
          context: "classroom assessment"
        },
        targetCriteria: {
          measurement: "percentage correct",
          target: 85,
          timeframe: "by annual review",
          accuracy: "4 out of 5 trials",
          conditions: "during math instruction"
        },
        evaluationMethod: "direct observation",
        frequency: "weekly",
        responsibleProvider: "user_123",
        isActive: true
      });
    });

    // Create fake Convex client with test data
    const fakeClient = new ConvexReactClientFake<typeof api>({
      queries: {
        "goals:getGoalDetail": async ({ goalId: id }) => {
          if (id === goalId) {
            return await t.query(api.queries.goals.getGoalDetail, { goalId: id });
          }
          return null;
        }
      },
      mutations: {
        "progress:recordProgressData": async (args) => {
          return await t.mutation(api.mutations.progress.recordProgressData, args);
        }
      }
    });

    // Render component with fake client
    render(
      <ConvexProvider client={fakeClient}>
        <ProgressMonitoringForm goalId={goalId} />
      </ConvexProvider>
    );

    // Wait for goal data to load
    await waitFor(() => {
      expect(screen.getByText("Math computation goal")).toBeInTheDocument();
    });

    // Fill out progress form
    const valueInput = screen.getByLabelText("Measurement Value");
    const notesInput = screen.getByLabelText("Observation Notes");
    const submitButton = screen.getByRole("button", { name: "Record Progress" });

    fireEvent.change(valueInput, { target: { value: "75" } });
    fireEvent.change(notesInput, { target: { value: "Student showed improvement" } });
    fireEvent.click(submitButton);

    // Verify progress was recorded
    await waitFor(() => {
      expect(screen.getByText("Progress recorded successfully")).toBeInTheDocument();
    });

    // Verify data was saved to mock backend
    const progressData = await t.run(async (ctx) => {
      return await ctx.db
        .query("progressData")
        .withIndex("by_goal", (q) => q.eq("goalId", goalId))
        .collect();
    });

    expect(progressData).toHaveLength(1);
    expect(progressData[0].measurementValue).toBe(75);
    expect(progressData[0].observationNotes).toBe("Student showed improvement");
  });
});
```

## Integration Testing with Local Backend

### Real Backend Testing Strategy

The open-source Convex backend enables comprehensive integration testing with full backend functionality, including real transaction semantics, proper data relationships, and complete component integration. This approach validates complex educational workflows end-to-end.

```typescript
// convex/test/integration-setup.ts
import { ConvexTestingHelper } from "convex-helpers/testing";
import { api } from "./_generated/api";

export class EducationTestingHelper extends ConvexTestingHelper {
  constructor() {
    super({
      backendUrl: "http://127.0.0.1:3210",
      // Uses default local backend admin key
      adminKey:
        "0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd",
    });
  }

  async setupEducationalEnvironment() {
    // Create test organization
    const organizationId = await this.mutation(
      api.mutations.organizations.create,
      {
        name: "Test School District",
        type: "district",
        address: {
          street: "100 Education Blvd",
          city: "Testville",
          state: "TS",
          zipCode: "12345",
          country: "USA",
        },
        contactInfo: {
          phone: "(555) TEST-EDU",
          email: "admin@testschool.edu",
        },
      }
    );

    // Create test users with different roles
    const adminId = await this.mutation(api.mutations.users.create, {
      email: "admin@testschool.edu",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      organizationId,
    });

    const teacherId = await this.mutation(api.mutations.users.create, {
      email: "teacher@testschool.edu",
      firstName: "Special Ed",
      lastName: "Teacher",
      role: "teacher",
      organizationId,
    });

    const parentId = await this.mutation(api.mutations.users.create, {
      email: "parent@family.com",
      firstName: "Test",
      lastName: "Parent",
      role: "parent",
      organizationId,
    });

    return { organizationId, adminId, teacherId, parentId };
  }

  async clearAllTestData() {
    await this.mutation(api.testingFunctions.clearAll, {});
  }
}
```

```typescript
// convex/test/iep-collaboration.integration.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { EducationTestingHelper } from "./integration-setup";

describe("IEP Collaboration Integration", () => {
  let t: EducationTestingHelper;
  let testEnvironment: any;

  beforeEach(async () => {
    t = new EducationTestingHelper();
    testEnvironment = await t.setupEducationalEnvironment();
  });

  afterEach(async () => {
    await t.clearAllTestData();
    await t.close();
  });

  test("collaborative IEP development with real-time updates", async () => {
    const { teacherId, parentId } = testEnvironment;

    // Create student with complex needs
    const studentId = await t.mutation(api.mutations.students.create, {
      firstName: "Jordan",
      lastName: "Smith",
      dateOfBirth: "2014-07-20",
      studentNumber: "JS-2024-001",
      gradeLevel: "4",
      primaryDisability: "Multiple Disabilities",
      secondaryDisabilities: ["Intellectual Disability", "Speech Impairment"],
      caseManagerId: teacherId,
      enrollmentStatus: "active",
      iepStatus: "pending",
    });

    // Teacher initiates IEP development
    const iepId = await t
      .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
      .mutation(api.mutations.ieps.createIEP, {
        studentId,
        effectiveDate: "2024-09-01",
        expirationDate: "2025-08-31",
        meetingDate: "2024-08-20",
        placement: "Special Education Classroom with Inclusion",
        serviceHours: {
          specialEducation: 1200, // 20 hours per week
          speechTherapy: 120, // 2 hours per week
          occupationalTherapy: 60, // 1 hour per week
          physicalTherapy: 60, // 1 hour per week
        },
        teamMembers: [teacherId],
      });

    // Add multiple goals across domains
    const mathGoalId = await t
      .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
      .mutation(api.mutations.goals.createGoal, {
        iepId,
        domain: "academic",
        description:
          "Jordan will solve single-digit addition problems with 80% accuracy",
        baselineData: {
          measurement: "correct responses",
          date: "2024-08-01",
          value: 40,
          context: "structured teaching session",
        },
        targetCriteria: {
          measurement: "percentage correct",
          target: 80,
          timeframe: "by annual review",
          accuracy: "4 out of 5 consecutive sessions",
          conditions: "using manipulatives as needed",
        },
        evaluationMethod: "direct observation and data collection",
        frequency: "daily",
        responsibleProvider: teacherId,
      });

    const behaviorGoalId = await t
      .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
      .mutation(api.mutations.goals.createGoal, {
        iepId,
        domain: "behavioral",
        description:
          "Jordan will remain in assigned area for 10 minutes during structured activities",
        baselineData: {
          measurement: "duration in minutes",
          date: "2024-08-01",
          value: 3,
          context: "classroom observation",
        },
        targetCriteria: {
          measurement: "duration in minutes",
          target: 10,
          timeframe: "by quarterly review",
          accuracy: "3 out of 4 opportunities",
          conditions: "with verbal prompts as needed",
        },
        evaluationMethod: "time sampling data collection",
        frequency: "daily",
        responsibleProvider: teacherId,
      });

    // Simulate collaborative progress monitoring
    for (let week = 1; week <= 4; week++) {
      // Record math progress - showing improvement
      await t
        .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
        .mutation(api.mutations.progress.recordProgressData, {
          goalId: mathGoalId,
          measurementValue: 40 + week * 5, // Gradual improvement
          measurementUnit: "percentage",
          observationNotes: `Week ${week}: Student showing consistent progress with addition facts`,
          context: "morning math instruction",
          masteryLevel: week < 3 ? "developing" : "proficient",
          sessionDuration: 30,
        });

      // Record behavior progress - more variable
      await t
        .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
        .mutation(api.mutations.progress.recordProgressData, {
          goalId: behaviorGoalId,
          measurementValue: Math.min(3 + week * 1.5, 8), // Slower progress
          measurementUnit: "minutes",
          observationNotes: `Week ${week}: ${week > 2 ? "Good progress" : "Needs additional support"} with staying in area`,
          context: "structured activity time",
          masteryLevel: week < 4 ? "developing" : "proficient",
          sessionDuration: 20,
        });
    }

    // Generate comprehensive progress report
    const progressReport = await t.query(
      api.queries.reports.generateProgressReport,
      {
        studentId,
        reportingPeriod: "monthly",
        includeGraphs: true,
      }
    );

    expect(progressReport).toBeDefined();
    expect(progressReport.goals).toHaveLength(2);

    // Verify math goal shows improvement trend
    const mathProgress = progressReport.goals.find(
      (g) => g.goalId === mathGoalId
    );
    expect(mathProgress?.trendDirection).toBe("improving");
    expect(mathProgress?.currentLevel).toBeGreaterThan(40);

    // Verify behavior goal shows progress but may need adjustment
    const behaviorProgress = progressReport.goals.find(
      (g) => g.goalId === behaviorGoalId
    );
    expect(behaviorProgress?.trendDirection).toBe("improving");
    expect(behaviorProgress?.dataPoints).toHaveLength(4);

    // Test parent access to appropriate information
    const parentView = await t
      .withIdentity({ tokenIdentifier: "parent@family.com" })
      .query(api.queries.students.getStudentProgressSummary, {
        studentId,
        includeConfidential: false,
      });

    expect(parentView).toBeDefined();
    expect(parentView?.currentGoals).toHaveLength(2);
    // Verify parents don't see confidential notes
    expect(
      parentView?.recentProgress.every(
        (p) => !p.observationNotes?.includes("confidential")
      )
    ).toBe(true);
  });

  test("document collaboration with version control", async () => {
    const { teacherId } = testEnvironment;

    // Create student for document testing
    const studentId = await t.mutation(api.mutations.students.create, {
      firstName: "Document",
      lastName: "TestStudent",
      dateOfBirth: "2015-01-01",
      studentNumber: "DTS-001",
      gradeLevel: "3",
      primaryDisability: "Learning Disability",
      caseManagerId: teacherId,
      enrollmentStatus: "active",
      iepStatus: "active",
    });

    // Start collaborative document session
    const documentId = "iep-draft-" + studentId;

    // First user starts editing
    await t
      .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
      .mutation(api.mutations.collaboration.updateDocumentContent, {
        documentId,
        operation: {
          type: "insert",
          position: 0,
          content:
            "Student Profile: Document TestStudent demonstrates significant strengths in verbal communication.",
          timestamp: Date.now(),
          userId: teacherId,
        },
        baseVersion: 0,
      });

    // Update presence to show active editing
    await t
      .withIdentity({ tokenIdentifier: "teacher@testschool.edu" })
      .mutation(api.mutations.collaboration.updateUserPresence, {
        documentId,
        cursorPosition: 95,
        selection: { start: 80, end: 95 },
      });

    // Verify document state
    const documentState = await t.query(
      api.queries.collaboration.getDocumentState,
      {
        documentId,
      }
    );

    expect(documentState).toBeDefined();
    expect(documentState?.version).toBe(1);
    expect(documentState?.content).toContain("Document TestStudent");

    // Check active editors
    const activeEditors = await t.query(
      api.queries.collaboration.getActiveEditors,
      {
        documentId,
      }
    );

    expect(activeEditors).toHaveLength(1);
    expect(activeEditors[0].userId).toBe(teacherId);
  });
});
```

## Preview Deployment Testing

### Production-Like Environment Validation

Convex preview deployments provide isolated environments for testing complete application stacks with production-like configurations. This approach validates educational workflows under realistic conditions while maintaining data isolation.

```typescript
// convex/testingFunctions.ts - Environment-protected test utilities
import { mutation } from "./_generated/server";
import { customMutation } from "convex-helpers/server/customFunctions";

// Wrapper to ensure test functions only run in test environments
export const testingMutation = customMutation(mutation, {
  args: {},
  input: async (_ctx, _args) => {
    if (process.env.IS_TEST === undefined) {
      throw new Error(
        "Calling a test only function in an unexpected environment"
      );
    }
    return { ctx: {}, args: {} };
  }
});

export const clearAll = testingMutation({
  args: {},
  handler: async (ctx) => {
    // Clear all test data in safe order to maintain referential integrity

    // Clear progress data first
    const progressData = await ctx.db.query("progressData").collect();
    for (const record of progressData) {
      await ctx.db.delete(record._id);
    }

    // Clear goals
    const goals = await ctx.db.query("goals").collect();
    for (const goal of goals) {
      await ctx.db.delete(goal._id);
    }

    // Clear IEPs
    const ieps = await ctx.db.query("ieps").collect();
    for (const iep of ieps) {
      await ctx.db.delete(iep._id);
    }

    // Clear assessments
    const assessments = await ctx.db.query("assessments").collect();
    for (const assessment of assessments) {
      await ctx.db.delete(assessment._id);
    }

    // Clear documents
    const documents = await ctx.db.query("documents").collect();
    for (const document of documents) {
      await ctx.db.delete(document._id);
    }

    // Clear students
    const students = await ctx.db.query("students").collect();
    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    // Clear users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    // Clear organizations
    const organizations = await ctx.db.query("organizations").collect();
    for (const organization of organizations) {
      await ctx.db.delete(organization._id);
    }

    // Clear audit logs
    const auditLogs = await ctx.db.query("auditLogs").collect();
    for (const log of auditLogs) {
      await ctx.db.delete(log._id);
    }

    console.log("All
```
