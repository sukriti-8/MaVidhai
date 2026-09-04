"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
<<<<<<< HEAD
=======
import { signup as signupAPI } from "@/lib/api";
>>>>>>> origin/backend-development

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const handleSignup = async () => {
    let valid = true;

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setSuccessMessage("");

    if (!name.trim()) {
      setNameError("Full name is required");
      valid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password is required");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }

    if (!valid) {
      return;
    }

    setIsSubmitting(true);

<<<<<<< HEAD
    // Backend authentication will be connected here later.
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);

    localStorage.setItem(
      "mavidhai_user",
      JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: "",
        age: "",
      })
    );

    setSuccessMessage("Welcome to MaVidhai! Your account has been created.");

    setTimeout(() => {
      router.push("/login");
    }, 1000);
=======
    try {
      await signupAPI(name, email, password);
      setSuccessMessage("Welcome to MaVidhai! Your account has been created.");
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1000);
    } catch (err) {
      setConfirmPasswordError(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
>>>>>>> origin/backend-development
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-[#2B2B2B]">
          Create Account
        </h1>

        <p className="mt-3 text-center text-[#6B6B6B]">
          Join MaVidhai and start shopping today.
        </p>

        {/* Full Name */}
        <div className="mt-8">
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Full Name
          </label>

          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
          />

          {nameError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mt-6">
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Email Address
          </label>

          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
          />

          {emailError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-6">
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {passwordError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mt-6">
          <label
            htmlFor="signup-confirm-password"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Confirm Password
          </label>

          <div className="relative">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227] transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {confirmPasswordError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {confirmPasswordError}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <button
            type="button"
            onClick={handleSignup}
            disabled={isSubmitting}
          className="mt-8 w-full rounded-lg bg-[#C9A227] py-3 text-white font-semibold hover:bg-[#B8860B] hover:scale-105 hover:shadow-lg transition-all duration-300"
       >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>
      {successMessage && (
        <p
          className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
          role="status"
        >
          {successMessage}
        </p>
      )}

        {/* Login */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#C9A227] hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}