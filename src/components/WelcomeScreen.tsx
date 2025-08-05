import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function WelcomeScreen() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    organization: "",
    specialization: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as any,
        organization: formData.organization || undefined,
        specialization: formData.specialization || undefined,
      });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { value: "special_educator", label: "Special Educator" },
    { value: "general_educator", label: "General Educator" },
    { value: "service_provider", label: "Service Provider" },
    { value: "administrator", label: "Administrator" },
    { value: "parent", label: "Parent/Guardian" },
    { value: "student", label: "Student" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 sm:mb-6 shadow-xl">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent mb-2 sm:mb-3">
            Welcome to SpedSync
          </h1>
          <p className="text-base sm:text-xl text-slate-600">
            Let's set up your profile to get started with collaborative IEP
            management
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 font-medium">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Enter your first name"
                  className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700 font-medium">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Enter your last name"
                  className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-700 font-medium">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-slate-700 font-medium">Organization</Label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                placeholder="School district, organization, etc."
                className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-slate-700 font-medium">Specialization</Label>
              <Input
                id="specialization"
                type="text"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                placeholder="e.g., Autism, Learning Disabilities, Speech Therapy"
                className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isSubmitting ? "Creating Profile..." : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
