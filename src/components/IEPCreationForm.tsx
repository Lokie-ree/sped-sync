import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema
const iepFormSchema = z
  .object({
    studentName: z
      .string()
      .min(2, "Student name must be at least 2 characters")
      .max(100, "Student name must be less than 100 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Student name can only contain letters, spaces, hyphens, and apostrophes"
      ),

    studentId: z
      .string()
      .min(3, "Student ID must be at least 3 characters")
      .max(20, "Student ID must be less than 20 characters")
      .regex(
        /^[A-Za-z0-9-]+$/,
        "Student ID can only contain letters, numbers, and hyphens"
      ),

    grade: z.string().min(1, "Grade level is required"),

    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 3 && age <= 22;
      }, "Student must be between 3 and 22 years old for special education services"),

    disability: z.string().min(1, "Primary disability is required"),

    meetingDate: z
      .string()
      .min(1, "IEP meeting date is required")
      .refine((date) => {
        const meetingDate = new Date(date);
        const today = new Date();
        return meetingDate <= today;
      }, "Meeting date cannot be in the future"),

    annualReviewDate: z.string().min(1, "Annual review date is required"),
  })
  .refine(
    (data) => {
      const meetingDate = new Date(data.meetingDate);
      const reviewDate = new Date(data.annualReviewDate);
      return reviewDate > meetingDate;
    },
    {
      message: "Annual review date must be after the meeting date",
      path: ["annualReviewDate"],
    }
  );

type IEPFormValues = z.infer<typeof iepFormSchema>;

interface IEPCreationFormProps {
  onSuccess: (iepId: any) => void;
  onCancel: () => void;
}

const gradeOptions = [
  { value: "pre-k", label: "Pre-K" },
  { value: "k", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
  { value: "post-secondary", label: "Post-Secondary" },
];

const disabilityOptions = [
  { value: "autism", label: "Autism Spectrum Disorder" },
  { value: "deaf-blindness", label: "Deaf-Blindness" },
  { value: "deafness", label: "Deafness" },
  { value: "emotional-disturbance", label: "Emotional Disturbance" },
  { value: "hearing-impairment", label: "Hearing Impairment" },
  { value: "intellectual-disability", label: "Intellectual Disability" },
  { value: "multiple-disabilities", label: "Multiple Disabilities" },
  { value: "orthopedic-impairment", label: "Orthopedic Impairment" },
  { value: "other-health-impairment", label: "Other Health Impairment" },
  {
    value: "specific-learning-disability",
    label: "Specific Learning Disability",
  },
  {
    value: "speech-language-impairment",
    label: "Speech or Language Impairment",
  },
  { value: "traumatic-brain-injury", label: "Traumatic Brain Injury" },
  { value: "visual-impairment", label: "Visual Impairment" },
];

export function IEPCreationForm({ onSuccess, onCancel }: IEPCreationFormProps) {
  const createIEP = useMutation(api.ieps.createIEP);

  const form = useForm<IEPFormValues>({
    resolver: zodResolver(iepFormSchema),
    defaultValues: {
      studentName: "",
      studentId: "",
      grade: "",
      dateOfBirth: "",
      disability: "",
      meetingDate: "",
      annualReviewDate: "",
    },
  });

  const onSubmit = async (values: IEPFormValues) => {
    try {
      const iepId = await createIEP(values);
      toast.success("IEP created successfully!");
      form.reset();
      onSuccess(iepId);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create IEP";
      toast.error(errorMessage);
      console.error("Error creating IEP:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Create New IEP</h3>
        <p className="text-slate-600 mt-1">
          Enter the student information to create a new Individualized Education
          Program.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter student's full name"
                      {...field}
                      className="transition-all"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the student's full legal name as it appears on
                    official documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., STU-2024-001"
                      {...field}
                      className="transition-all"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the student in your school system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current grade level or program placement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="transition-all" />
                  </FormControl>
                  <FormDescription>
                    Student must be between 3 and 22 years old for special
                    education services.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="disability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Disability *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary disability category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {disabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Primary disability category under IDEA that qualifies the
                  student for special education services.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* IEP Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="meetingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IEP Meeting Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="transition-all" />
                  </FormControl>
                  <FormDescription>
                    Date when the IEP team met to develop this plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="annualReviewDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Review Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="transition-all" />
                  </FormControl>
                  <FormDescription>
                    Date for the next annual IEP review (must be within 365
                    days).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="sm:w-auto"
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating IEP...
                </>
              ) : (
                "Create IEP"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
