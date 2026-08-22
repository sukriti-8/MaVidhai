"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_STORAGE_KEY = "mavidhai_user";
const AUTH_EVENT = "mavidhai-auth-changed";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    window.dispatchEvent(new Event(AUTH_EVENT));

    router.push("/");
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please log in to view your profile.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-[#C9A227] px-5 py-2.5 text-white font-medium hover:bg-[#B8860B] transition"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#2B2B2B]">
            My Profile
          </h1>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">Name</p>
          <p className="mt-1 text-lg font-medium text-gray-800">
            {user.name}
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 text-lg font-medium text-gray-800">
            {user.email}
          </p>
        </div>
      </div>
    </main>
  );
}