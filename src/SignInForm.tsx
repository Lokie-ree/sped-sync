"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <Input 
          type="email" 
          name="email" 
          placeholder="Email" 
          required 
          className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
        />
        <Button 
          type="submit" 
          disabled={submitting} 
          className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>
        <div className="text-center text-sm text-slate-600">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-center my-4 sm:my-6">
        <Separator className="flex-1 bg-slate-200" />
        <span className="mx-3 sm:mx-4 text-slate-500 text-sm font-medium">or</span>
        <Separator className="flex-1 bg-slate-200" />
      </div>
      <Button
        variant="outline"
        className="w-full h-11 sm:h-12 text-base sm:text-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
        onClick={() => void signIn("anonymous")}
      >
        Sign in anonymously
      </Button>
    </div>
  );
}
