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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 sm:w-6 sm:h-6 text-white"
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
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    SpedSync
                  </h1>
                  <p className="text-sm text-slate-500">
                    Welcome, {userProfile.firstName} {userProfile.lastName}
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">SpedSync</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationCenter />
              <div className="hidden sm:block text-right">
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
        {/* Sidebar - Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-64 bg-white/90 backdrop-blur-sm border-r border-slate-200/60
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 sm:p-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => handleNavigation(item.id as View)}
                    className={`w-full justify-start text-sm sm:text-base transition-all duration-200 ${
                      currentView === item.id 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl' 
                        : 'hover:bg-slate-100 hover:shadow-sm'
                    }`}
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
        <main className="flex-1 p-4 sm:p-6 w-full lg:w-auto">
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
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
      icon: "✅",
    },
    {
      label: "In Review",
      value: ieps?.filter((iep) => iep.status === "in_review").length || 0,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "from-yellow-50 to-yellow-100",
      icon: "⏳",
    },
    {
      label: "Draft IEPs",
      value: ieps?.filter((iep) => iep.status === "draft").length || 0,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      icon: "📝",
    },
    {
      label: "Due Soon",
      value: 0, // TODO: Calculate based on review dates
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100",
      icon: "⚠️",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h2>
        <p className="text-slate-600">
          Monitor your IEP portfolio and track student progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-slate-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-lg group-hover:scale-110 transition-transform duration-200`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="pt-6">
          <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {ieps?.slice(0, 5).map((iep) => (
              <div
                key={iep._id}
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {iep.studentName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {iep.studentName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge variant="outline" className="capitalize text-xs bg-white/80 backdrop-blur-sm">
                      {iep.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-slate-500">
                    {new Date(iep._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-slate-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <p>No IEPs found. Create your first IEP to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
