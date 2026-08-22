"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";

const AUTH_STORAGE_KEY = "mavidhai_user";
const AUTH_EVENT = "mavidhai-auth-changed";

const BRAND = {
  primary: "#C9A227",
  hover: "#B8860B",
};

const PROFILE_MENU = [
  {
    id: "profile",
    label: "My Profile",
    icon: User,
  },
  {
    id: "orders",
    label: "My Orders",
    icon: Package,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);

  /*
   * Load the currently logged-in user.
   */
  const loadUser = () => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!savedUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("Could not load saved user information:", error);

      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    }

    setIsLoading(false);
  };

  /*
   * Load user when page opens
   * and stay synchronized with authentication changes.
   */
  useEffect(() => {
    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
  }, []);

  /*
   * Redirect unauthenticated users to login.
   */
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  /*
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    window.dispatchEvent(new Event(AUTH_EVENT));

    router.push("/");
  };

  /*
   * Show loading state while checking localStorage.
   */
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fffdf8]">
        <p className="text-sm text-[#81786d]">
          Loading your profile...
        </p>
      </main>
    );
  }

  /*
   * Prevent profile content from flashing
   * before redirecting unauthenticated users.
   */
  if (!user) {
    return null;
  }

  const firstName = user.name?.trim().split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#fffdf8] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ================= HEADER ================= */}

        <div className="mb-8">
          <p
            className="text-xs font-medium uppercase tracking-[3px]"
            style={{ color: BRAND.primary }}
          >
            My Account
          </p>

          <h1 className="mt-2 text-4xl font-semibold text-[#29251f]">
            Welcome back, {firstName}
          </h1>

          <p className="mt-2 text-[#756d63]">
            Manage your profile, orders and preferences.
          </p>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="grid gap-6 md:grid-cols-[230px_1fr]">

          {/* ================= SIDEBAR ================= */}

          <aside className="h-fit rounded-2xl border border-[#eadfca] bg-white p-3 shadow-sm">

            {PROFILE_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-[#f7efdf] text-[#a9790d]"
                      : "text-[#5e574e] hover:bg-[#faf7f0]"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}

            <div className="my-3 border-t border-[#eee5d6]" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>

          </aside>

          {/* ================= MAIN CONTENT ================= */}

          <section className="rounded-2xl border border-[#eadfca] bg-white p-6 shadow-sm md:p-8">

            {activeSection === "profile" && (
              <ProfileSection
                user={user}
                onEdit={() => setActiveSection("settings")}
              />
            )}

            {activeSection === "orders" && (
              <EmptySection
                icon={<Package size={28} />}
                title="Your Orders"
                description="Your orders will appear here once you start shopping."
                buttonText="Continue Shopping"
                href="/shop"
              />
            )}

            {activeSection === "wishlist" && (
              <EmptySection
                icon={<Heart size={28} />}
                title="Your Wishlist"
                description="Save products you love and find them here later."
                buttonText="Explore Products"
                href="/shop"
              />
            )}

            {activeSection === "addresses" && (
              <EmptySection
                icon={<MapPin size={28} />}
                title="Saved Addresses"
                description="Your delivery addresses will appear here."
                buttonText="Shop Now"
                href="/shop"
              />
            )}

            {activeSection === "settings" && (
              <ProfileSettings
                user={user}
                setUser={setUser}
              />
            )}

          </section>
        </div>
      </div>
    </main>
  );
}


/* ============================================================
   PROFILE SECTION
   ============================================================ */

function ProfileSection({ user, onEdit }) {
  const firstLetter = user.name?.charAt(0).toUpperCase() || "M";

  return (
    <>
      <div className="flex flex-col gap-5 border-b border-[#eee5d6] pb-6 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e8d0] text-2xl font-semibold text-[#a9790d]">
            {firstLetter}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#332d26]">
              {user.name}
            </h2>

            <p className="mt-1 text-sm text-[#81786d]">
              {user.email}
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#d9c79f] px-4 py-2 text-sm font-medium text-[#9b7211] transition hover:bg-[#faf5e9]"
        >
          <Pencil size={16} />
          Edit Profile
        </button>

      </div>

      <div className="mt-8">

        <h3 className="text-lg font-semibold text-[#332d26]">
          Personal Information
        </h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          <InfoCard
            label="Full Name"
            value={user.name}
          />

          <InfoCard
            label="Email Address"
            value={user.email}
          />

          <InfoCard
            label="Phone Number"
            value={user.phone}
          />

          <InfoCard
            label="Age"
            value={user.age ? `${user.age} years` : ""}
          />

        </div>

      </div>
    </>
  );
}


/* ============================================================
   INFO CARD
   ============================================================ */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#eee5d6] bg-[#fffdf8] p-4">

      <p className="text-xs uppercase tracking-[1.5px] text-[#9b8a70]">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-[#40382f]">
        {value || "Not added"}
      </p>

    </div>
  );
}


/* ============================================================
   EMPTY SECTION
   ============================================================ */

function EmptySection({
  icon,
  title,
  description,
  buttonText,
  href,
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ecd9] text-[#b8860b]">
        {icon}
      </div>

      <h2 className="mt-5 text-2xl font-semibold text-[#332d26]">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#81786d]">
        {description}
      </p>

      <Link
        href={href}
        className="mt-6 rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B8860B]"
      >
        {buttonText}
      </Link>

    </div>
  );
}


/* ============================================================
   PROFILE SETTINGS
   ============================================================ */

function ProfileSettings({ user, setUser }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    age: user.age || "",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...form,
    };

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);

    window.dispatchEvent(new Event(AUTH_EVENT));

    setSaved(true);
  };

  return (
    <div>

      <h2 className="text-2xl font-semibold text-[#332d26]">
        Edit Profile
      </h2>

      <p className="mt-2 text-sm text-[#81786d]">
        Update your personal information.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">

        <FormField
          label="Full Name"
          value={form.name}
          onChange={(value) => handleChange("name", value)}
        />

        <FormField
          label="Email Address"
          value={form.email}
          onChange={(value) => handleChange("email", value)}
          type="email"
        />

        <FormField
          label="Phone Number"
          value={form.phone}
          onChange={(value) => handleChange("phone", value)}
          type="tel"
        />

        <FormField
          label="Age"
          value={form.age}
          onChange={(value) => handleChange("age", value)}
          type="number"
        />

      </div>

      <button
        type="button"
        onClick={handleSave}
        className="mt-7 rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B8860B]"
      >
        Save Changes
      </button>

      {saved && (
        <p className="mt-3 text-sm text-green-600">
          Profile updated successfully.
        </p>
      )}

    </div>
  );
}


/* ============================================================
   FORM FIELD
   ============================================================ */

function FormField({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-[#40382f]">
        {label}
      </label>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#ddd2bd] bg-white px-4 py-3 text-sm text-[#332d26] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
      />

    </div>
  );
}