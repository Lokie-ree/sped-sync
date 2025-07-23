import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface IEPListProps {
  onSelectIEP: (iepId: any) => void;
  selectedIEP: any;
}

export function IEPList({ onSelectIEP, selectedIEP }: IEPListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    grade: "",
    dateOfBirth: "",
    disability: "",
    meetingDate: "",
    annualReviewDate: "",
  });

  const ieps = useQuery(api.ieps.getUserIEPs);
  const createIEP = useMutation(api.ieps.createIEP);

  const handleCreateIEP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const iepId = await createIEP(formData);
      toast.success("IEP created successfully!");
      setShowCreateForm(false);
      setFormData({
        studentName: "",
        studentId: "",
        grade: "",
        dateOfBirth: "",
        disability: "",
        meetingDate: "",
        annualReviewDate: "",
      });
      onSelectIEP(iepId);
    } catch (error) {
      toast.error("Failed to create IEP");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "in_review": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-purple-100 text-purple-800";
      case "expired": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">IEP Management</h2>
          <p className="text-slate-600 mt-1">
            Create, edit, and collaborate on Individualized Education Programs
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New IEP</span>
        </button>
      </div>

      {/* IEP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ieps?.map((iep) => (
          <div
            key={iep._id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
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
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(iep.status)}`}>
                {iep.status.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Disability:</span>
                <span className="font-medium text-slate-900">{iep.disability}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Meeting Date:</span>
                <span className="font-medium text-slate-900">{iep.meetingDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Annual Review:</span>
                <span className="font-medium text-slate-900">{iep.annualReviewDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {iep.teamMembers.slice(0, 3).map((_, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                    >
                      {index + 1}
                    </div>
                  ))}
                  {iep.teamMembers.length > 3 && (
                    <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white flex items-center justify-center text-slate-600 text-xs font-medium">
                      +{iep.teamMembers.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {iep.teamMembers.length} team member{iep.teamMembers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {iep.content.goals.length} goal{iep.content.goals.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No IEPs Found</h3>
            <p className="text-slate-600 mb-4">Get started by creating your first IEP</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Create New IEP
            </button>
          </div>
        )}
      </div>

      {/* Create IEP Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Create New IEP</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateIEP} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Grade *
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Primary Disability *
                </label>
                <input
                  type="text"
                  value={formData.disability}
                  onChange={(e) => setFormData({ ...formData, disability: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="e.g., Autism, Learning Disability, Speech Impairment"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    IEP Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Annual Review Date *
                  </label>
                  <input
                    type="date"
                    value={formData.annualReviewDate}
                    onChange={(e) => setFormData({ ...formData, annualReviewDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Create IEP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
