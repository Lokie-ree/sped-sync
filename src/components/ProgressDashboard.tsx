import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "./ui/card";

export function ProgressDashboard() {
  const ieps = useQuery(api.ieps.getUserIEPs);
  const progressData = useQuery(api.progress.getAllProgressData);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Progress Monitoring
        </h2>
        <p className="text-slate-600 mt-1">
          Track student progress and intervention effectiveness
        </p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Goals on Track
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {ieps?.reduce(
                    (acc, iep) =>
                      acc +
                      iep.content.goals.filter((g: any) => g.progress >= 70)
                        .length,
                    0
                  ) || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Needs Attention
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {ieps?.reduce(
                  (acc, iep) =>
                    acc +
                    iep.content.goals.filter((g: any) => g.progress < 50)
                      .length,
                  0
                ) || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Data Points</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {progressData?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Progress</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {ieps?.length
                  ? Math.round(
                      ieps.reduce(
                        (acc, iep) =>
                          acc +
                          iep.content.goals.reduce(
                            (goalAcc: number, goal: any) =>
                              goalAcc + goal.progress,
                            0
                          ) /
                            iep.content.goals.length,
                        0
                      ) / ieps.length
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Student Progress List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">
            Student Progress Overview
          </h3>
        </div>
        <div className="p-6">
          {ieps?.length ? (
            <div className="space-y-6">
              {ieps.map((iep) => (
                <div
                  key={iep._id}
                  className="border border-slate-200 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">
                        {iep.studentName}
                      </h4>
                      <p className="text-sm text-slate-600">
                        Grade {iep.grade} • {iep.disability}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Overall Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {iep.content.goals.length
                          ? Math.round(
                              iep.content.goals.reduce(
                                (acc: number, goal: any) => acc + goal.progress,
                                0
                              ) / iep.content.goals.length
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {iep.content.goals.map((goal: any, index: number) => (
                      <div
                        key={goal.id || index}
                        className="bg-slate-50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-slate-900">
                            {goal.area}
                          </h5>
                          <span className="text-sm font-medium text-slate-600">
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              goal.progress >= 70
                                ? "bg-green-500"
                                : goal.progress >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {goal.goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Progress Data
              </h3>
              <p className="text-slate-600">
                Create IEPs and start tracking student progress
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
