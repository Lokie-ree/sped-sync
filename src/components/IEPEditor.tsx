import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CollaborateTab } from "./CollaborateTab";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

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
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {iep.studentName} - IEP
              </DialogTitle>
              <p className="text-slate-600 flex items-center gap-2">
                Status:{" "}
                <Badge variant="outline" className="capitalize">
                  {iep.status.replace("_", " ")}
                </Badge>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit IEP</Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-7">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center space-x-1"
              >
                <span>{tab.icon}</span>
                <span className="font-medium hidden sm:inline">
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 overflow-y-auto max-h-[60vh]">
            <TabsContent value="overview">
              <OverviewTab
                iep={iep}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>
            <TabsContent value="goals">
              <GoalsTab
                iep={iep}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>
            <TabsContent value="services">
              <ServicesTab
                iep={iep}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>
            <TabsContent value="accommodations">
              <AccommodationsTab
                iep={iep}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>
            <TabsContent value="collaborate">
              <CollaborateTab iepId={iepId} />
            </TabsContent>
            <TabsContent value="team">
              <TeamTab iep={iep} />
            </TabsContent>
            <TabsContent value="ai-plan">
              <AIPlanTab iepId={iepId} onGenerate={handleGenerateAIPlan} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function OverviewTab({ iep, isEditing, formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="studentName">Student Name</Label>
          {isEditing ? (
            <Input
              id="studentName"
              type="text"
              value={formData.studentName || ""}
              onChange={(e) =>
                setFormData({ ...formData, studentName: e.target.value })
              }
            />
          ) : (
            <p className="text-slate-900 font-medium px-3 py-2">
              {iep.studentName}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <p className="text-slate-900 font-medium px-3 py-2">
            {iep.studentId}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="presentLevels">Present Levels of Performance</Label>
        {isEditing ? (
          <Textarea
            id="presentLevels"
            value={formData.content?.presentLevels || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                content: { ...formData.content, presentLevels: e.target.value },
              })
            }
            rows={6}
            placeholder="Describe the student's current academic achievement and functional performance..."
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-700">
                {iep.content.presentLevels ||
                  "No present levels documented yet."}
              </p>
            </CardContent>
          </Card>
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
        goals: [...(formData.content?.goals || []), newGoal],
      },
    });
  };

  const updateGoal = (index: number, field: string, value: any) => {
    const updatedGoals = [...(formData.content?.goals || [])];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setFormData({
      ...formData,
      content: { ...formData.content, goals: updatedGoals },
    });
  };

  const goals = formData.content?.goals || iep.content.goals || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">
          IEP Goals & Objectives
        </h3>
        {isEditing && (
          <Button onClick={addGoal} className="flex items-center space-x-2">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Goal</span>
          </Button>
        )}
      </div>

      {goals.map((goal: any, index: number) => (
        <Card key={goal.id || index}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`area-${index}`}>Goal Area</Label>
                {isEditing ? (
                  <Input
                    id={`area-${index}`}
                    type="text"
                    value={goal.area}
                    onChange={(e) => updateGoal(index, "area", e.target.value)}
                    placeholder="e.g., Reading, Math, Communication"
                  />
                ) : (
                  <p className="font-medium text-slate-900 px-3 py-2">
                    {goal.area}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Progress</Label>
                <div className="flex items-center space-x-3">
                  <Progress value={goal.progress} className="flex-1" />
                  <Badge variant="outline">{goal.progress}%</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`goal-${index}`}>Goal Statement</Label>
              {isEditing ? (
                <Textarea
                  id={`goal-${index}`}
                  value={goal.goal}
                  onChange={(e) => updateGoal(index, "goal", e.target.value)}
                  rows={3}
                  placeholder="Write a specific, measurable goal..."
                />
              ) : (
                <p className="text-slate-700 px-3 py-2">{goal.goal}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`timeline-${index}`}>Timeline</Label>
                {isEditing ? (
                  <Input
                    id={`timeline-${index}`}
                    type="text"
                    value={goal.timeline}
                    onChange={(e) =>
                      updateGoal(index, "timeline", e.target.value)
                    }
                    placeholder="e.g., By end of school year"
                  />
                ) : (
                  <p className="text-slate-700 px-3 py-2">{goal.timeline}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`responsible-${index}`}>
                  Responsible Party
                </Label>
                {isEditing ? (
                  <Input
                    id={`responsible-${index}`}
                    type="text"
                    value={goal.responsibleParty}
                    onChange={(e) =>
                      updateGoal(index, "responsibleParty", e.target.value)
                    }
                    placeholder="e.g., Special Education Teacher"
                  />
                ) : (
                  <p className="text-slate-700 px-3 py-2">
                    {goal.responsibleParty}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {goals.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No Goals Yet
            </h3>
            <p className="text-slate-600 mb-4">
              Add IEP goals to track student progress
            </p>
            {isEditing && <Button onClick={addGoal}>Add First Goal</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ServicesTab({ iep, isEditing, formData, setFormData }: any) {
  const services = formData.content?.services || iep.content.services || [];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-900">
        Special Education Services
      </h3>

      {services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Service Type</Label>
                    <p className="font-semibold text-slate-900">
                      {service.type}
                    </p>
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <p className="font-semibold text-slate-900">
                      {service.frequency}
                    </p>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <p className="font-semibold text-slate-900">
                      {service.duration}
                    </p>
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <p className="font-semibold text-slate-900">
                      {service.provider}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-slate-600">No services defined yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AccommodationsTab({ iep, isEditing, formData, setFormData }: any) {
  const accommodations =
    formData.content?.accommodations || iep.content.accommodations || [];
  const modifications =
    formData.content?.modifications || iep.content.modifications || [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Accommodations</CardTitle>
        </CardHeader>
        <CardContent>
          {accommodations.length > 0 ? (
            <ul className="space-y-2">
              {accommodations.map((accommodation: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center space-x-3 bg-green-50 p-3 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">{accommodation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 p-4">No accommodations defined yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modifications</CardTitle>
        </CardHeader>
        <CardContent>
          {modifications.length > 0 ? (
            <ul className="space-y-2">
              {modifications.map((modification: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">{modification}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 p-4">No modifications defined yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamTab({ iep }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-900">IEP Team Members</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {iep.teamMembers.map((memberId: string, index: number) => (
          <Card key={memberId}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Team Member {index + 1}
                  </p>
                  <p className="text-sm text-slate-600">Role pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AIPlanTab({
  iepId,
  onGenerate,
}: {
  iepId: any;
  onGenerate: () => void;
}) {
  const plan = useQuery(api.ai.getImplementationPlan, { iepId });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">
          AI Implementation Plan
        </h3>
        <Button onClick={onGenerate} className="flex items-center space-x-2">
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>Generate AI Plan</span>
        </Button>
      </div>

      {plan ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-900">
                Priority Interventions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.plan.priorities.map((priority: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">
                          {priority.goal}
                        </h5>
                        <Badge variant="outline">
                          Priority {priority.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {priority.rationale}
                      </p>
                      <p className="text-sm text-slate-500">
                        Timeline: {priority.timeline}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-900">Compliance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.plan.complianceAlerts.map((alert: any, index: number) => (
                  <div
                    key={index}
                    className={`rounded-xl p-4 ${
                      alert.severity === "high"
                        ? "bg-red-100 border border-red-200"
                        : alert.severity === "medium"
                          ? "bg-yellow-100 border border-yellow-200"
                          : "bg-green-100 border border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-slate-900">
                        {alert.type}
                      </h5>
                      <span className="text-sm text-slate-600">
                        {alert.deadline}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No AI Plan Generated
            </h3>
            <p className="text-slate-600 mb-4">
              Generate an AI-powered implementation plan for this IEP
            </p>
            <Button onClick={onGenerate}>Generate AI Plan</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
