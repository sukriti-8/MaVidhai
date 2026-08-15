"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");

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

    if (!valid) {
      return;
    }

    console.log("Email:", email);
    console.log("Password:", password);

    alert("Login Successful!");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-[#2B2B2B]">
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-[#6B6B6B]">
          Sign in to continue to MaVidhai
        </p>

        {/* Email */}
        <div className="mt-8">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Email Address
          </label>

          <input
            id="login-email"
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
            htmlFor="login-password"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
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

        {/* Forgot Password */}
        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-[#C9A227] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="button"
          onClick={handleLogin}
          className="mt-6 w-full rounded-lg bg-[#C9A227] py-3 text-white font-semibold hover:bg-[#B8860B] hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          Login
        </button>

        {/* Sign Up */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#C9A227] hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}