import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getIEPAnalytics = query({
  args: { timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get all IEPs user has access to
    const allIEPs = await ctx.db.query("ieps").collect();
    const ieps = allIEPs.filter(iep => 
      iep.createdBy === userId || iep.teamMembers.includes(userId)
    );

    // Calculate time range
    const now = Date.now();
    const timeRangeMs = args.timeRange === "week" ? 7 * 24 * 60 * 60 * 1000 :
                       args.timeRange === "month" ? 30 * 24 * 60 * 60 * 1000 :
                       args.timeRange === "quarter" ? 90 * 24 * 60 * 60 * 1000 :
                       365 * 24 * 60 * 60 * 1000; // year
    const startTime = now - timeRangeMs;

    // Filter IEPs by time range
    const filteredIEPs = ieps.filter(iep => iep._creationTime >= startTime);

    // Status distribution
    const statusCounts = filteredIEPs.reduce((acc, iep) => {
      acc[iep.status] = (acc[iep.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Goal completion rates
    let totalGoals = 0;
    let completedGoals = 0;
    let inProgressGoals = 0;

    filteredIEPs.forEach(iep => {
      iep.content.goals.forEach(goal => {
        totalGoals++;
        if (goal.progress >= 100) {
          completedGoals++;
        } else if (goal.progress > 0) {
          inProgressGoals++;
        }
      });
    });

    // Disability distribution
    const disabilityCounts = filteredIEPs.reduce((acc, iep) => {
      acc[iep.disability] = (acc[iep.disability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Grade distribution
    const gradeCounts = filteredIEPs.reduce((acc, iep) => {
      acc[iep.grade] = (acc[iep.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Service types
    const serviceCounts = filteredIEPs.reduce((acc, iep) => {
      iep.content.services.forEach(service => {
        acc[service.type] = (acc[service.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Compliance metrics
    const upcomingReviews = filteredIEPs.filter(iep => {
      const reviewDate = new Date(iep.annualReviewDate).getTime();
      const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
      return reviewDate <= thirtyDaysFromNow && reviewDate >= now;
    }).length;

    const overdueReviews = filteredIEPs.filter(iep => {
      const reviewDate = new Date(iep.annualReviewDate).getTime();
      return reviewDate < now && iep.status === "active";
    }).length;

    return {
      overview: {
        totalIEPs: filteredIEPs.length,
        activeIEPs: statusCounts.active || 0,
        draftIEPs: statusCounts.draft || 0,
        inReviewIEPs: statusCounts.in_review || 0,
        totalGoals,
        completedGoals,
        inProgressGoals,
        goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / filteredIEPs.length) * 100),
      })),
      disabilityDistribution: Object.entries(disabilityCounts).map(([disability, count]) => ({
        disability,
        count,
        percentage: Math.round((count / filteredIEPs.length) * 100),
      })),
      gradeDistribution: Object.entries(gradeCounts).map(([grade, count]) => ({
        grade,
        count,
        percentage: Math.round((count / filteredIEPs.length) * 100),
      })),
      serviceDistribution: Object.entries(serviceCounts).map(([service, count]) => ({
        service,
        count,
      })),
      compliance: {
        upcomingReviews,
        overdueReviews,
        complianceRate: filteredIEPs.length > 0 ? 
          Math.round(((filteredIEPs.length - overdueReviews) / filteredIEPs.length) * 100) : 100,
      },
      trends: await calculateTrends(ctx, userId, timeRangeMs),
    };
  },
});

async function calculateTrends(ctx: any, userId: string, timeRangeMs: number) {
  const now = Date.now();
  const periods = 6; // 6 periods for trend analysis
  const periodLength = timeRangeMs / periods;
  
  const trends = [];
  
  for (let i = 0; i < periods; i++) {
    const periodStart = now - ((periods - i) * periodLength);
    const periodEnd = now - ((periods - i - 1) * periodLength);
    
    const allPeriodIEPs = await ctx.db
      .query("ieps")
      .filter((q: any) => 
        q.and(
          q.gte(q.field("_creationTime"), periodStart),
          q.lt(q.field("_creationTime"), periodEnd)
        )
      )
      .collect();
    
    const periodIEPs = allPeriodIEPs.filter((iep: any) => 
      iep.createdBy === userId || iep.teamMembers.includes(userId)
    );
    
    trends.push({
      period: i + 1,
      date: new Date(periodStart).toISOString().split('T')[0],
      iepsCreated: periodIEPs.length,
      activeIEPs: periodIEPs.filter((iep: any) => iep.status === "active").length,
    });
  }
  
  return trends;
}

export const generateReport = mutation({
  args: {
    reportType: v.union(
      v.literal("summary"),
      v.literal("compliance"),
      v.literal("progress"),
      v.literal("detailed")
    ),
    timeRange: v.string(),
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      disability: v.optional(v.string()),
      grade: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate report data based on type
    const analytics: any = await ctx.runQuery(api.analytics.getIEPAnalytics, { 
      timeRange: args.timeRange 
    });

    const reportId: any = await ctx.db.insert("reports", {
      userId,
      reportType: args.reportType,
      timeRange: args.timeRange,
      filters: args.filters || {},
      data: analytics,
      status: "generated",
    });

    return reportId;
  },
});

export const getReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("reports")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report || report.userId !== userId) {
      throw new Error("Report not found or access denied");
    }

    return report;
  },
});
