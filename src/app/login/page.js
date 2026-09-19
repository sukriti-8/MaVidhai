"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login as loginAPI } from "@/lib/api";

const colors = {
  ivory: "#F8F6F2",
  white: "#FFFFFF",
  peach: "#F2C9B9",
  terracotta: "#A85838",
  sage: "#A8B39F",
  forest: "#3F5144",
  charcoal: "#1D1D1B",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegisteredMessage(
        "Account created successfully. Please log in to continue."
      );
    }
  }, [searchParams]);

  const handleLogin = async () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
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
      await loginAPI(trimmedEmail, password);

      setSuccessMessage(
        "Login successful! Welcome back to VRHAZ."
      );

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
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: colors.ivory }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-xl"
        style={{
          backgroundColor: colors.white,
          color: colors.charcoal,
        }}
      >
        {/* Heading */}
        <h1
          className="text-center text-4xl font-medium"
          style={{
            color: colors.charcoal,
            fontFamily: "Georgia, serif",
          }}
        >
          Welcome Back
        </h1>

        <p
          className="mt-3 text-center text-sm"
          style={{ color: colors.charcoal }}
        >
          Sign in to continue to VRHAZ
        </p>

        {/* Registered Message */}
        {registeredMessage && (
          <p
            className="mt-4 rounded-lg px-4 py-3 text-center text-sm"
            style={{
              backgroundColor: "#F0F5EF",
              color: colors.forest,
            }}
            role="status"
          >
            {registeredMessage}
          </p>
        )}

        {/* Email */}
        <div className="mt-8">
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-medium"
            style={{ color: colors.charcoal }}
          >
            Email Address
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
            style={{
              borderColor: colors.sage,
              backgroundColor: colors.white,
              color: colors.charcoal,
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = colors.charcoal;
              event.currentTarget.style.outline = `2px solid ${colors.charcoal}`;
              event.currentTarget.style.outlineOffset = "1px";
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = colors.sage;
              event.currentTarget.style.outline = "none";
            }}
          />

          {emailError && (
            <p
              className="mt-2 text-sm"
              style={{ color: "#B42318" }}
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-6">
          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-medium"
            style={{ color: colors.charcoal }}
          >
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-lg border px-4 py-3 pr-12 text-sm outline-none transition-colors"
              style={{
                borderColor: colors.sage,
                backgroundColor: colors.white,
                color: colors.charcoal,
              }}
              onFocus={(event) => {
                event.currentTarget.style.borderColor = colors.charcoal;
                event.currentTarget.style.outline = `2px solid ${colors.charcoal}`;
                event.currentTarget.style.outlineOffset = "1px";
              }}
              onBlur={(event) => {
                event.currentTarget.style.borderColor = colors.sage;
                event.currentTarget.style.outline = "none";
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: colors.charcoal }}
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
              className="mt-2 text-sm"
              style={{ color: "#B42318" }}
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>

        {/* Forgot Password */}
        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium transition-colors hover:underline focus:outline-2 focus:outline-offset-2"
            style={{
              color: colors.terracotta,
              outlineColor: colors.charcoal,
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg py-3 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: colors.peach,
            color: colors.charcoal,
            outlineColor: colors.charcoal,
          }}
        >
          {isSubmitting ? "Signing In..." : "Login"}
        </button>

        {/* Success Message */}
        {successMessage && (
          <p
            className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "#F0F5EF",
              color: colors.forest,
            }}
            role="status"
          >
            {successMessage}
          </p>
        )}

        {/* Sign Up */}
        <p
          className="mt-6 text-center text-sm"
          style={{ color: colors.charcoal }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold hover:underline focus:outline-2 focus:outline-offset-2"
            style={{
              color: colors.terracotta,
              outlineColor: colors.charcoal,
            }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: colors.ivory }}
        >
          <p style={{ color: colors.charcoal }}>Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}