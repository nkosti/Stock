"use client";

import { useState } from "react";
import { X, Mail, Lock, User } from "lucide-react";
import EmailVerification from "./EmailVerification";
import InputField from "./InputField/InputField";
import { toast } from "react-toastify";
import PasswordRequirements from "./PasswordRequirements/PasswordRequirements";
import usePasswordValidation from "@/hooks/forms/usePasswordValidation";
import { apiFetch } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { validation: passwordValidation, validate: validatePassword } =
    usePasswordValidation();
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const isPasswordValid =
    isLogin || Object.values(passwordValidation).every(Boolean);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Login
        const data = await apiFetch<{ access_token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        localStorage.setItem("token", data.access_token);
        onClose();
        toast.success("Login successful!");
      } else {
        // Register
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        setShowVerification(true);
        toast.info("Check your email to verify your account");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate password on change if it's the password field
    if (name === "password" && !isLogin) {
      validatePassword(value);
    }
  };

  const handleVerified = () => {
    setShowVerification(false);
    onClose();
    toast.success("Email verified successfully! You can now log in.");
  };

  const handleBackToLogin = () => {
    setShowVerification(false);
    setIsLogin(true);
  };

  const handleModeSwitch = () => {
    // Clear form data when switching between login/signup
    setFormData({
      email: "",
      password: "",
      name: "",
    });
    setIsLogin(!isLogin);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 relative">
        {showVerification ? (
          <EmailVerification
            email={formData.email}
            onBack={handleBackToLogin}
            onVerified={handleVerified}
          />
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {isLogin ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-slate-600 mt-2">
                {isLogin
                  ? "Welcome back to StockValuer"
                  : "Join StockValuer today"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* cтворив перевикористовуваний компонент InputField */}
              {!isLogin && (
                <InputField
                  label={"Full Name"}
                  icon={<User className="h-5 w-5" />}
                  name={"name"}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={"John Doe"}
                  required={!isLogin}
                />
              )}

              <InputField
                label={"Email Address"}
                icon={<Mail className="h-5 w-5" />}
                type={"email"}
                name={"email"}
                value={formData.email}
                onChange={handleInputChange}
                placeholder={"john@example.com"}
                required={true}
              />

              <div>
                <InputField
                  label={"Password"}
                  icon={<Lock className="h-5 w-5" />}
                  type={"password"}
                  name={"password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={"••••••••"}
                  required={true}
                />

                {!isLogin && formData.password && (
                  <PasswordRequirements validation={passwordValidation} />
                )}
              </div>

              <button
                type="submit"
                disabled={!isLogin && !isPasswordValid}
                className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                  isLogin || isPasswordValid
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={handleModeSwitch}
                  className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
