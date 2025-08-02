import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IEPCreationForm } from "./IEPCreationForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { ComponentLoader } from "./LoadingSpinner";

interface IEPListProps {
  onSelectIEP: (iepId: any) => void;
  selectedIEP: any;
}

export function IEPList({ onSelectIEP, selectedIEP }: IEPListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const ieps = useQuery(api.ieps.getUserIEPs);

  const handleCreateSuccess = (iepId: any) => {
    setShowCreateForm(false);
    onSelectIEP(iepId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "approved":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (ieps === undefined) {
    return <ComponentLoader text="Loading IEPs..." height="400px" />;
  }

  return (
    <ComponentErrorBoundary componentName="IEP Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              IEP Management
            </h2>
            <p className="text-slate-600 mt-1">
              Create, edit, and collaborate on Individualized Education Programs
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New IEP</span>
          </Button>
        </div>

        {/* IEP Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {ieps?.map((iep) => (
            <div
              key={iep._id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer hover:border-slate-300"
              onClick={() => onSelectIEP(iep._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    {iep.studentName}
                  </h3>
                  <p className="text-sm text-slate-600">ID: {iep.studentId}</p>
                  <p className="text-sm text-slate-600">Grade: {iep.grade}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(iep.status)}`}
                >
                  {iep.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Disability:</span>
                  <span className="font-medium text-slate-900">
                    {iep.disability}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Meeting Date:</span>
                  <span className="font-medium text-slate-900">
                    {iep.meetingDate}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Annual Review:</span>
                  <span className="font-medium text-slate-900">
                    {iep.annualReviewDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {iep.teamMembers?.slice(0, 3).map((_, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                      >
                        {index + 1}
                      </div>
                    ))}
                    {iep.teamMembers?.length > 3 && (
                      <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white flex items-center justify-center text-slate-600 text-xs font-medium">
                        +{iep.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {iep.teamMembers?.length || 0} team member
                    {(iep.teamMembers?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {iep.content?.goals?.length || 0} goal
                  {(iep.content?.goals?.length || 0) !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-12">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No IEPs Found
              </h3>
              <p className="text-slate-600 mb-4">
                Get started by creating your first IEP
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create New IEP
              </Button>
            </div>
          )}
        </div>

        {/* Create IEP Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New IEP</DialogTitle>
            </DialogHeader>
            <IEPCreationForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ComponentErrorBoundary>
  );
}
