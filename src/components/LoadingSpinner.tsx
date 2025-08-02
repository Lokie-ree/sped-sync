import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  variant?: "blue" | "white" | "slate";
}

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
  variant = "blue",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    blue: "border-blue-600",
    white: "border-white",
    slate: "border-slate-600",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3">
        <div
          className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${variantClasses[variant]}`}
          role="status"
          aria-label="Loading"
        />
        {text && (
          <span className={`text-slate-600 ${textSizeClasses[size]}`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

// Full page loading component
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="blue" />
        <p className="mt-4 text-lg text-slate-600">{text}</p>
      </div>
    </div>
  );
}

// Component-level loading component
export function ComponentLoader({
  text = "Loading...",
  height = "200px",
}: {
  text?: string;
  height?: string;
}) {
  return (
    <div
      className="flex items-center justify-center bg-white rounded-2xl border border-slate-200"
      style={{ minHeight: height }}
    >
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// Inline loading component for buttons
export function ButtonLoader({ size = "sm" }: { size?: "sm" | "md" }) {
  return <LoadingSpinner size={size} variant="white" className="mr-2" />;
}
