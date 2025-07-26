import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CollaborateTab } from "./CollaborateTab";

interface IEPEditorProps {
  iepId: any;
  onClose: () => void;
}

export function IEPEditor({ iepId, onClose }: IEPEditorProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const iep = useQuery(api.ieps.getIEP, { iepId });
  const updateIEP = useMutation(api.ieps.updateIEP);
  const generateAIPlan = useMutation(api.ai.generateImplementationPlan);

  useEffect(() => {
    if (iep) {
      setFormData(iep);
    }
  }, [iep]);

  const handleSave = async () => {
    try {
      await updateIEP({
        iepId,
        updates: formData,
      });
      toast.success("IEP updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update IEP");
    }
  };

  const handleGenerateAIPlan = async () => {
    try {
      await generateAIPlan({ iepId });
      toast.success("AI implementation plan generated!");
    } catch (error) {
      toast.error("Failed to generate AI plan");
    }
  };

  if (!iep) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "goals", label: "Goals & Objectives", icon: "🎯" },
    { id: "services", label: "Services", icon: "🛠️" },
    { id: "accommodations", label: "Accommodations", icon: "⚙️" },
    { id: "collaborate", label: "Collaborate", icon: "✏️" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "ai-plan", label: "AI Plan", icon: "🤖" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {iep.studentName} - IEP
            </h2>
            <p className="text-slate-600">
              Status: <span className="capitalize">{iep.status.replace("_", " ")}</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit IEP
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <OverviewTab iep={iep} isEditing={isEditing} formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "goals" && (
            <GoalsTab iep={iep} isEditing={isEditing} formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "services" && (
            <ServicesTab iep={iep} isEditing={isEditing} formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "accommodations" && (
            <AccommodationsTab iep={iep} isEditing={isEditing} formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "collaborate" && (
            <CollaborateTab iepId={iepId} />
          )}
          {activeTab === "team" && (
            <TeamTab iep={iep} />
          )}
          {activeTab === "ai-plan" && (
            <AIPlanTab iepId={iepId} onGenerate={handleGenerateAIPlan} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ iep, isEditing, formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Student Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.studentName || ""}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-hidden transition-all"
            />
          ) : (
            <p className="text-slate-900 font-medium">{iep.studentName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Student ID
          </label>
          <p className="text-slate-900 font-medium">{iep.studentId}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Present Levels of Performance
        </label>
        {isEditing ? (
          <textarea
            value={formData.content?.presentLevels || ""}
            onChange={(e) => setFormData({
              ...formData,
              content: { ...formData.content, presentLevels: e.target.value }
            })}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-hidden transition-all"
            placeholder="Describe the student's current academic achievement and functional performance..."
          />
        ) : (
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-700">
              {iep.content.presentLevels || "No present levels documented yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalsTab({ iep, isEditing, formData, setFormData }: any) {
  const addGoal = () => {
    const newGoal = {
      id: Date.now().toString(),
      area: "",
      goal: "",
      objectives: [""],
      measurableOutcomes: "",
      timeline: "",
      responsibleParty: "",
      progress: 0,
    };
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        goals: [...(formData.content?.goals || []), newGoal]
      }
    });
  };

  const updateGoal = (index: number, field: string, value: any) => {
    const updatedGoals = [...(formData.content?.goals || [])];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setFormData({
      ...formData,
      content: { ...formData.content, goals: updatedGoals }
    });
  };

  const goals = formData.content?.goals || iep.content.goals || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">IEP Goals & Objectives</h3>
        {isEditing && (
          <button
            onClick={addGoal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Goal</span>
          </button>
        )}
      </div>

      {goals.map((goal: any, index: number) => (
        <div key={goal.id || index} className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Goal Area
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={goal.area}
                    onChange={(e) => updateGoal(index, "area", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden"
                    placeholder="e.g., Reading, Math, Communication"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{goal.area}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Progress
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{goal.progress}%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Goal Statement
              </label>
              {isEditing ? (
                <textarea
                  value={goal.goal}
                  onChange={(e) => updateGoal(index, "goal", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden"
                  placeholder="Write a specific, measurable goal..."
                />
              ) : (
                <p className="text-slate-700">{goal.goal}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Timeline
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={goal.timeline}
                    onChange={(e) => updateGoal(index, "timeline", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden"
                    placeholder="e.g., By end of school year"
                  />
                ) : (
                  <p className="text-slate-700">{goal.timeline}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Responsible Party
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={goal.responsibleParty}
                    onChange={(e) => updateGoal(index, "responsibleParty", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden"
                    placeholder="e.g., Special Education Teacher"
                  />
                ) : (
                  <p className="text-slate-700">{goal.responsibleParty}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {goals.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Goals Yet</h3>
          <p className="text-slate-600 mb-4">Add IEP goals to track student progress</p>
          {isEditing && (
            <button
              onClick={addGoal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Add First Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ServicesTab({ iep, isEditing, formData, setFormData }: any) {
  const services = formData.content?.services || iep.content.services || [];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-900">Special Education Services</h3>
      
      {services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service: any, index: number) => (
            <div key={index} className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Service Type</span>
                  <p className="font-semibold text-slate-900">{service.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Frequency</span>
                  <p className="font-semibold text-slate-900">{service.frequency}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Duration</span>
                  <p className="font-semibold text-slate-900">{service.duration}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Provider</span>
                  <p className="font-semibold text-slate-900">{service.provider}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <p className="text-slate-600">No services defined yet.</p>
        </div>
      )}
    </div>
  );
}

function AccommodationsTab({ iep, isEditing, formData, setFormData }: any) {
  const accommodations = formData.content?.accommodations || iep.content.accommodations || [];
  const modifications = formData.content?.modifications || iep.content.modifications || [];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Accommodations</h3>
        {accommodations.length > 0 ? (
          <ul className="space-y-2">
            {accommodations.map((accommodation: string, index: number) => (
              <li key={index} className="flex items-center space-x-3 bg-green-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700">{accommodation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 bg-slate-50 p-4 rounded-xl">No accommodations defined yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Modifications</h3>
        {modifications.length > 0 ? (
          <ul className="space-y-2">
            {modifications.map((modification: string, index: number) => (
              <li key={index} className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">{modification}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 bg-slate-50 p-4 rounded-xl">No modifications defined yet.</p>
        )}
      </div>
    </div>
  );
}

function TeamTab({ iep }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-900">IEP Team Members</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {iep.teamMembers.map((memberId: string, index: number) => (
          <div key={memberId} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-slate-900">Team Member {index + 1}</p>
                <p className="text-sm text-slate-600">Role pending</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPlanTab({ iepId, onGenerate }: { iepId: any; onGenerate: () => void }) {
  const plan = useQuery(api.ai.getImplementationPlan, { iepId });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">AI Implementation Plan</h3>
        <button
          onClick={onGenerate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Generate AI Plan</span>
        </button>
      </div>

      {plan ? (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-4">Priority Interventions</h4>
            <div className="space-y-3">
              {plan.plan.priorities.map((priority: any, index: number) => (
                <div key={index} className="bg-white rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-slate-900">{priority.goal}</h5>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      Priority {priority.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{priority.rationale}</p>
                  <p className="text-sm text-slate-500">Timeline: {priority.timeline}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Compliance Alerts</h4>
            <div className="space-y-3">
              {plan.plan.complianceAlerts.map((alert: any, index: number) => (
                <div key={index} className={`rounded-xl p-4 ${
                  alert.severity === "high" ? "bg-red-100 border border-red-200" :
                  alert.severity === "medium" ? "bg-yellow-100 border border-yellow-200" :
                  "bg-green-100 border border-green-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-900">{alert.type}</h5>
                    <span className="text-sm text-slate-600">{alert.deadline}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No AI Plan Generated</h3>
          <p className="text-slate-600 mb-4">Generate an AI-powered implementation plan for this IEP</p>
          <button
            onClick={onGenerate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Generate AI Plan
          </button>
        </div>
      )}
    </div>
  );
}
