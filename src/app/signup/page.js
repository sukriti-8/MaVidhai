"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signup as signupAPI } from "@/lib/api";

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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Full name validation
    if (!trimmedName) {
      setNameError("Full name is required");
      valid = false;
    }

    // Email validation
    if (!trimmedEmail) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }

    // Confirm password validation
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

    try {
      await signupAPI(trimmedName, trimmedEmail, password);

      setSuccessMessage(
        "Welcome to VRHAZ! Your account has been created."
      );

      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1000);
    } catch (err) {
      setConfirmPasswordError(
        err.message || "Failed to create account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F6F2] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Heading */}
        <h1 className="text-center text-4xl font-bold text-[#1D1D1B]">
          Create Account
        </h1>

        <p className="mt-3 text-center text-[#1D1D1B]">
          Join VRHAZ and start shopping today.
        </p>

        {/* Full Name */}
        <div className="mt-8">
          <label
            htmlFor="signup-name"
            className="mb-2 block text-sm font-medium text-[#1D1D1B]"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#1D1D1B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:border-[#1D1D1B]"
          />

          {nameError && (
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mt-6">
          <label
            htmlFor="signup-email"
            className="mb-2 block text-sm font-medium text-[#1D1D1B]"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#1D1D1B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:border-[#1D1D1B]"
          />

          {emailError && (
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-6">
          <label
            htmlFor="signup-password"
            className="mb-2 block text-sm font-medium text-[#1D1D1B]"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-[#1D1D1B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:border-[#1D1D1B]"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#A85838] focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] rounded-sm"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {passwordError && (
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mt-6">
          <label
            htmlFor="signup-confirm-password"
            className="mb-2 block text-sm font-medium text-[#1D1D1B]"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-[#1D1D1B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:border-[#1D1D1B]"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#A85838] focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] rounded-sm"
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
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {confirmPasswordError}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <button
          type="button"
          onClick={handleSignup}
          disabled={isSubmitting}
          className="mt-8 w-full rounded-lg bg-[#F2C9B9] py-3 font-semibold text-[#1D1D1B] transition-all duration-300 hover:brightness-95 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>

        {/* Success Message */}
        {successMessage && (
          <p
            className="mt-4 rounded-lg bg-[#A8B39F] px-4 py-3 text-sm text-[#1D1D1B]"
            role="status"
          >
            {successMessage}
          </p>
        )}

        {/* Login */}
        <p className="mt-6 text-center text-sm text-[#1D1D1B]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#A85838] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1D1D1B] focus:ring-offset-2"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}