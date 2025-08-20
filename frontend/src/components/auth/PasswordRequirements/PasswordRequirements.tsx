import { AlertCircle, Check } from "lucide-react";

interface Props {
  validation: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export default function PasswordRequirements({ validation }: Props) {
  return (
    <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
      <p className="text-sm font-medium text-slate-700 mb-2">
        Password Requirements:
      </p>
      {Object.entries(validation).map(([key, valid]) => {
        const labelMap: Record<string, string> = {
          minLength: "At least 8 characters",
          hasUppercase: "One uppercase letter",
          hasLowercase: "One lowercase letter",
          hasNumber: "One number",
          hasSpecial: "One special character",
        };
        return (
          <div
            key={key}
            className={`flex items-center text-xs ${
              valid ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {valid ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {labelMap[key]}
          </div>
        );
      })}
    </div>
  );
}
