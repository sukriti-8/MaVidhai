"use client";

import { useState } from "react";
import Link from "next/link";

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

    // Email Validation
    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }

    // Password Validation
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }

    if (!valid) return;

    console.log("Email:", email);
    console.log("Password:", password);

    alert("Login Successful!");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">

        <h1 className="text-4xl font-bold text-center">
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-gray-600">
          Sign in to continue to MaVidhai
        </p>

        {/* Email */}

        <div className="mt-8">

          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#C9A227] focus:outline-none"
          />

          {emailError && (
            <p className="text-red-600 text-sm mt-2">
              {emailError}
            </p>
          )}

        </div>

        {/* Password */}

        <div className="mt-6">

          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2"
          >
            Password
          </label>

          <div className="relative">

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-[#C9A227] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

          </div>

          {passwordError && (
            <p className="text-red-600 text-sm mt-2">
              {passwordError}
            </p>
          )}

        </div>

        {/* Forgot Password */}

        <div className="mt-3 text-right">

          <Link
            href="/forgot-password"
            className="text-[#C9A227] hover:underline"
          >
            Forgot Password?
          </Link>

        </div>

        {/* Login */}

        <button
          onClick={handleLogin}
          className="mt-6 w-full bg-[#C9A227] hover:bg-[#B8860B] text-white font-semibold py-3 rounded-lg transition"
        >
          Login
        </button>

        {/* Signup */}

        <p className="mt-6 text-center text-gray-600">

          Don't have an account?{" "}

          <Link
            href="/signup"
            className="text-[#C9A227] font-semibold hover:underline"
          >
            Sign Up
          </Link>

        </p>

      </div>
    </main>
  );
}