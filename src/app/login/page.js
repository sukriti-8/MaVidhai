"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const AUTH_STORAGE_KEY = "mavidhai_user";
const AUTH_EVENT = "mavidhai-auth-changed";

const BRAND = {
  color: "#C9A227",
  hoverColor: "#B8860B",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

=======
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login as loginAPI } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
>>>>>>> origin/backend-development
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD

  const [successMessage, setSuccessMessage] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
=======
  const [successMessage, setSuccessMessage] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const searchParams = useSearchParams();
  const [registeredMessage, setRegisteredMessage] = useState("");
>>>>>>> origin/backend-development

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegisteredMessage(
        "Account created successfully. Please log in to continue."
      );
    }
<<<<<<< HEAD
  }, [searchParams]);

  const handleLogin = async () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

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

    if (!valid) {
      return;
    }

    setIsSubmitting(true);

    // Temporary authentication simulation.
    // Backend authentication will replace this later.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const loggedInUser = {
      name: trimmedEmail.split("@")[0],
      email: trimmedEmail,
    };

    // Store logged-in user
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(loggedInUser)
    );

    // Tell Navbar that authentication state changed
    window.dispatchEvent(new Event(AUTH_EVENT));

    setSuccessMessage(
      "Login successful! Welcome back to MaVidhai."
    );

    setIsSubmitting(false);

    // Go back to home
    router.push("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">

=======
}, [searchParams]);

 const handleLogin = async () => {
  let valid = true;

  setEmailError("");
  setPasswordError("");
  setSuccessMessage("");

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

  setIsSubmitting(true);

  try {
    await loginAPI(email, password);
    setSuccessMessage("Login successful! Welcome back to MaVidhai.");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  } catch (err) {
    setPasswordError(err.message || "Failed to log in");
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
>>>>>>> origin/backend-development
        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-[#2B2B2B]">
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-[#6B6B6B]">
          Sign in to continue to MaVidhai
        </p>
<<<<<<< HEAD

        {/* Registered Message */}
=======
>>>>>>> origin/backend-development
        {registeredMessage && (
          <p
            className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-700"
            role="status"
          >
            {registeredMessage}
          </p>
        )}

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
<<<<<<< HEAD
            onChange={(event) => setEmail(event.target.value)}
=======
            onChange={(e) => setEmail(e.target.value)}
>>>>>>> origin/backend-development
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
          />

          {emailError && (
<<<<<<< HEAD
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
=======
            <p className="mt-2 text-sm text-red-600" role="alert">
>>>>>>> origin/backend-development
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
<<<<<<< HEAD
              onChange={(event) => setPassword(event.target.value)}
=======
              onChange={(e) => setPassword(e.target.value)}
>>>>>>> origin/backend-development
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
            />

            <button
              type="button"
<<<<<<< HEAD
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227] transition-colors"
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
=======
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A227] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
>>>>>>> origin/backend-development
            </button>
          </div>

          {passwordError && (
<<<<<<< HEAD
            <p
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
=======
            <p className="mt-2 text-sm text-red-600" role="alert">
>>>>>>> origin/backend-development
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
          disabled={isSubmitting}
<<<<<<< HEAD
          className="mt-6 w-full rounded-lg bg-[#C9A227] py-3 text-white font-semibold hover:bg-[#B8860B] hover:scale-105 hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing In..." : "Login"}
        </button>

        {/* Success Message */}
=======
          className="mt-6 w-full rounded-lg bg-[#C9A227] py-3 text-white font-semibold hover:bg-[#B8860B] hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          {isSubmitting ? "Signing In..." : "Login"}
        </button>
>>>>>>> origin/backend-development
        {successMessage && (
          <p
            className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {successMessage}
          </p>
        )}

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
<<<<<<< HEAD
=======
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
>>>>>>> origin/backend-development
}