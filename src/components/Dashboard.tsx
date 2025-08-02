import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { IEPList } from "./IEPList";
import { IEPEditor } from "./IEPEditor";
import { ProgressDashboard } from "./ProgressDashboard";
import { AIChat } from "./AIChat";
import { FileManager } from "./FileManager";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { NotificationCenter } from "./NotificationCenter";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { PageLoader } from "./LoadingSpinner";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

type View = "dashboard" | "ieps" | "progress" | "files" | "chat" | "analytics";

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedIEP, setSelectedIEP] = useState<any>(null);

  const userProfile = useQuery(api.users.getUserProfile);
  const ieps = useQuery(api.ieps.getUserIEPs);

  if (!userProfile) {
    return <PageLoader text="Loading your dashboard..." />;
  }

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "ieps", label: "IEPs", icon: "📋" },
    { id: "progress", label: "Progress", icon: "📊" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "files", label: "Files", icon: "📁" },
    { id: "chat", label: "AI Assistant", icon: "🤖" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    SpedSync
                  </h1>
                  <p className="text-sm text-slate-500">
                    Welcome, {userProfile.firstName} {userProfile.lastName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 capitalize">
                  {userProfile.role.replace("_", " ")}
                </p>
                {userProfile.organization && (
                  <p className="text-xs text-slate-500">
                    {userProfile.organization}
                  </p>
                )}
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => setCurrentView(item.id as View)}
                    className="w-full justify-start"
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === "dashboard" && (
            <ComponentErrorBoundary componentName="Dashboard Overview">
              <DashboardOverview ieps={ieps} />
            </ComponentErrorBoundary>
          )}
          {currentView === "ieps" && (
            <ComponentErrorBoundary componentName="IEP Management">
              <IEPList onSelectIEP={setSelectedIEP} selectedIEP={selectedIEP} />
            </ComponentErrorBoundary>
          )}
          {currentView === "progress" && (
            <ComponentErrorBoundary componentName="Progress Dashboard">
              <ProgressDashboard />
            </ComponentErrorBoundary>
          )}
          {currentView === "analytics" && (
            <ComponentErrorBoundary componentName="Analytics Dashboard">
              <AnalyticsDashboard />
            </ComponentErrorBoundary>
          )}
          {currentView === "files" && (
            <ComponentErrorBoundary componentName="File Manager">
              <FileManager />
            </ComponentErrorBoundary>
          )}
          {currentView === "chat" && (
            <ComponentErrorBoundary componentName="AI Chat">
              <AIChat />
            </ComponentErrorBoundary>
          )}
        </main>
      </div>

      {/* IEP Editor Modal */}
      {selectedIEP && (
        <IEPEditor iepId={selectedIEP} onClose={() => setSelectedIEP(null)} />
      )}
    </div>
  );
}

function DashboardOverview({ ieps }: { ieps: any[] | undefined }) {
  const stats = [
    {
      label: "Active IEPs",
      value: ieps?.filter((iep) => iep.status === "active").length || 0,
      color: "bg-green-500",
      icon: "✅",
    },
    {
      label: "In Review",
      value: ieps?.filter((iep) => iep.status === "in_review").length || 0,
      color: "bg-yellow-500",
      icon: "⏳",
    },
    {
      label: "Draft IEPs",
      value: ieps?.filter((iep) => iep.status === "draft").length || 0,
      color: "bg-blue-500",
      icon: "📝",
    },
    {
      label: "Due Soon",
      value: 0, // TODO: Calculate based on review dates
      color: "bg-red-500",
      icon: "⚠️",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Dashboard Overview
        </h2>
        <p className="text-slate-600">
          Monitor your IEP portfolio and track student progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {ieps?.slice(0, 5).map((iep) => (
              <div
                key={iep._id}
                className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {iep.studentName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {iep.studentName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge variant="outline" className="capitalize">
                      {iep.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {new Date(iep._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-slate-500">
                <p>No IEPs found. Create your first IEP to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
