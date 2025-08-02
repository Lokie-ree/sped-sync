import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const analytics = useQuery(api.analytics.getIEPAnalytics, { timeRange });
  const reports = useQuery(api.analytics.getReports);
  const generateReport = useMutation(api.analytics.generateReport);

  const handleGenerateReport = async (reportType: string) => {
    try {
      const reportId = await generateReport({
        reportType: reportType as any,
        timeRange,
      });
      toast.success("Report generated successfully!");
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const timeRanges = [
    { value: "week", label: "Last Week" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last Quarter" },
    { value: "year", label: "Last Year" },
  ];

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Analytics & Reports
          </h2>
          <p className="text-slate-600 mt-1">
            Comprehensive insights into your IEP portfolio and student progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => value && handleGenerateReport(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Generate Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary Report</SelectItem>
              <SelectItem value="compliance">Compliance Report</SelectItem>
              <SelectItem value="progress">Progress Report</SelectItem>
              <SelectItem value="detailed">Detailed Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total IEPs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {analytics.overview.totalIEPs}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Active IEPs
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {analytics.overview.activeIEPs}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Goal Completion
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {analytics.overview.goalCompletionRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Compliance Rate
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {analytics.compliance.complianceRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>IEP Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.statusDistribution.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        item.status === "active"
                          ? "bg-green-500"
                          : item.status === "in_review"
                            ? "bg-yellow-500"
                            : item.status === "draft"
                              ? "bg-blue-500"
                              : item.status === "approved"
                                ? "bg-purple-500"
                                : "bg-red-500"
                      }`}
                    ></div>
                    <span className="font-medium text-slate-900 capitalize">
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-600">{item.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disability Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Disability Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.disabilityDistribution.slice(0, 5).map((item) => (
                <div
                  key={item.disability}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium text-slate-900">
                    {item.disability}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={item.percentage} className="w-20" />
                    <span className="text-sm text-slate-600 w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">⚠️</span>
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Overdue Reviews</p>
                    <p className="text-sm text-red-700">
                      Require immediate attention
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-lg font-bold">
                  {analytics.compliance.overdueReviews}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⏰</span>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900">
                      Upcoming Reviews
                    </p>
                    <p className="text-sm text-yellow-700">
                      Due within 30 days
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-lg font-bold border-yellow-300 text-yellow-800"
                >
                  {analytics.compliance.upcomingReviews}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.serviceDistribution.slice(0, 5).map((item) => (
                <div
                  key={item.service}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium text-slate-900">
                    {item.service}
                  </span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>IEP Creation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end space-x-2">
            {analytics.trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700"
                  style={{
                    height: `${Math.max((trend.iepsCreated / Math.max(...analytics.trends.map((t) => t.iepsCreated))) * 200, 4)}px`,
                  }}
                ></div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    {trend.iepsCreated}
                  </p>
                  <p className="text-xs text-slate-500">{trend.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports?.slice(0, 5).map((report) => (
              <div
                key={report._id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">📊</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 capitalize">
                      {report.reportType.replace("_", " ")} Report
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(report._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      report.status === "generated" ? "default" : "secondary"
                    }
                  >
                    {report.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-slate-500">
                <p>No reports generated yet. Create your first report above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
