"use client";

import { useState } from "react";
import Link from "next/link";

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

  const handleSignup = () => {
    let valid = true;

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name.trim()) {
      setNameError("Full name is required");
      valid = false;
    }

    if (!email) {
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

    if (!valid) return;

    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);

    alert("Account created successfully!");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">

        <h1 className="text-4xl font-bold text-center text-[#2B2B2B]">
          Create Account
        </h1>

        <p className="mt-3 text-center text-[#6B6B6B]">
          Join MaVidhai and start shopping today.
        </p>

        {/* Full Name */}
        <div className="mt-8">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Full Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#C9A227] focus:outline-none"
          />

          {nameError && (
            <p className="mt-2 text-sm text-red-600">
              {nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mt-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
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
            <p className="mt-2 text-sm text-red-600">
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-[#C9A227] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227]"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {passwordError && (
            <p className="mt-2 text-sm text-red-600">
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mt-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[#2B2B2B] mb-2"
          >
            Confirm Password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-[#C9A227] focus:outline-none"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227]"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {confirmPasswordError && (
            <p className="mt-2 text-sm text-red-600">
              {confirmPasswordError}
            </p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleSignup}
          className="mt-8 w-full rounded-lg bg-[#C9A227] py-3 text-white font-semibold hover:bg-[#B8860B] transition-all duration-300"
        >
          Create Account
        </button>

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