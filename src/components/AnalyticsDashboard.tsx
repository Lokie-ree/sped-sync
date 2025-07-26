import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-600 mt-1">
            Comprehensive insights into your IEP portfolio and student progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-hidden"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <select
              onChange={(e) => e.target.value && handleGenerateReport(e.target.value)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors appearance-none pr-8"
              defaultValue=""
            >
              <option value="" disabled>Generate Report</option>
              <option value="summary">Summary Report</option>
              <option value="compliance">Compliance Report</option>
              <option value="progress">Progress Report</option>
              <option value="detailed">Detailed Report</option>
            </select>
            <svg className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total IEPs</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.overview.totalIEPs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active IEPs</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{analytics.overview.activeIEPs}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Goal Completion</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{analytics.overview.goalCompletionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Compliance Rate</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{analytics.compliance.complianceRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">IEP Status Distribution</h3>
          <div className="space-y-3">
            {analytics.statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.status === "active" ? "bg-green-500" :
                    item.status === "in_review" ? "bg-yellow-500" :
                    item.status === "draft" ? "bg-blue-500" :
                    item.status === "approved" ? "bg-purple-500" :
                    "bg-red-500"
                  }`}></div>
                  <span className="font-medium text-slate-900 capitalize">
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">{item.count}</span>
                  <span className="text-sm text-slate-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disability Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Disability Categories</h3>
          <div className="space-y-3">
            {analytics.disabilityDistribution.slice(0, 5).map((item) => (
              <div key={item.disability} className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{item.disability}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Compliance Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">⚠️</span>
                </div>
                <div>
                  <p className="font-medium text-red-900">Overdue Reviews</p>
                  <p className="text-sm text-red-700">Require immediate attention</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {analytics.compliance.overdueReviews}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⏰</span>
                </div>
                <div>
                  <p className="font-medium text-yellow-900">Upcoming Reviews</p>
                  <p className="text-sm text-yellow-700">Due within 30 days</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {analytics.compliance.upcomingReviews}
              </span>
            </div>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Service Types</h3>
          <div className="space-y-3">
            {analytics.serviceDistribution.slice(0, 5).map((item) => (
              <div key={item.service} className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{item.service}</span>
                <span className="text-slate-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">IEP Creation Trends</h3>
        <div className="h-64 flex items-end space-x-2">
          {analytics.trends.map((trend, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700"
                style={{
                  height: `${Math.max((trend.iepsCreated / Math.max(...analytics.trends.map(t => t.iepsCreated))) * 200, 4)}px`
                }}
              ></div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-slate-900">{trend.iepsCreated}</p>
                <p className="text-xs text-slate-500">{trend.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {reports?.slice(0, 5).map((report) => (
            <div key={report._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === "generated" ? "bg-green-100 text-green-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {report.status}
                </span>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-slate-500">
              <p>No reports generated yet. Create your first report above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
