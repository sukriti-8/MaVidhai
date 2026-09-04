"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  User,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getAuthToken, setAuthToken, getCart, getWishlist } from "@/lib/api";

const AUTH_STORAGE_KEY = "mavidhai_user";
const AUTH_EVENT = "mavidhai-auth-changed";

const BRAND = {
  name: "MaVidhai",
  color: "#C9A227",
  hoverColor: "#B8860B",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#about" },
];

const SEARCH_CONFIG = {
  action: "/search",
  queryParam: "q",
  placeholder: "Search products...",
};

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [cartCount, setCartCount] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(null);

  const { language, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation(["Home", "Shop", "Categories", "About"]);

  /*
   * Read the logged‑in user from localStorage.
   */
  const loadUser = () => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error("Invalid stored user data:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    }
  };

  /*
   * Load cart & wishlist counts using the backend API.
   */
  const loadCounts = async () => {
    const token = getAuthToken();
    if (!token) {
      setCartCount(null);
      setWishlistCount(null);
      return;
    }

    try {
      const cart = await getCart();
      setCartCount(cart.item_count);
    } catch (err) {
      if (err.message === "Unauthorized") setAuthToken(null);
    }

    try {
      const wishlist = await getWishlist();
      setWishlistCount(wishlist.count);
    } catch (err) {
      if (err.message === "Unauthorized") setAuthToken(null);
    }
  };

  /*
   * Load user and counts when Navbar mounts.
   * Listen for auth, cart, and wishlist changes.
   */
  useEffect(() => {
    loadUser();
    loadCounts();

    const handleAuthChange = () => {
      loadUser();
      loadCounts();
    };

    const handleCartUpdate = () => {
      loadCounts();
    };

    const handleWishlistUpdate = () => {
      loadCounts();
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("wishlist-updated", handleWishlistUpdate);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
    };
  }, []);

  /*
   * Logout.
   */
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setMenuOpen(false);
    router.push("/");
  };

  /*
   * Close mobile menu.
   */
  const closeMobileMenu = () => {
    setMenuOpen(false);
    setLanguageOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-4">
      {/* Navbar Container */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold hover:scale-105 transition-all duration-300"
          style={{ color: BRAND.color }}
        >
          {BRAND.name}
        </Link>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
            >
              {t(link.label)}
            </Link>
          ))}

          {/* Desktop Search */}
          <SearchForm desktop />

          {/* Desktop Language Selector */}
          <LanguageSelector
            language={language}
            languages={languages}
            languageOpen={languageOpen}
            setLanguageOpen={setLanguageOpen}
            changeLanguage={changeLanguage}
          />
        </div>

        {/* ================= DESKTOP AUTH & COUNTS ================= */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <LoggedInDesktop
              user={user}
              onLogout={handleLogout}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
            />
          ) : (
            <LoggedOutDesktop />
          )}
        </div>

        {/* ================= MOBILE MENU BUTTON ================= */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-8 py-4 bg-white border-t border-gray-200 text-gray-800">
          {/* Mobile Search */}
          <SearchForm />

          {/* Mobile Navigation */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileMenu}
              className="text-gray-800 hover:text-[#C9A227] transition-colors"
            >
              {t(link.label)}
            </Link>
          ))}

          {/* Mobile Language Selector */}
          <MobileLanguageSelector
            language={language}
            languages={languages}
            languageOpen={languageOpen}
            setLanguageOpen={setLanguageOpen}
            changeLanguage={changeLanguage}
          />

          <hr />

          {/* Mobile Authentication */}
          {user ? (
            <LoggedInMobile
              onLogout={handleLogout}
              onClose={closeMobileMenu}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
            />
          ) : (
            <LoggedOutMobile onClose={closeMobileMenu} />
          )}
        </div>
      )}
    </nav>
  );
}

/* ============================================================
   SEARCH
   ============================================================ */
function SearchForm({ desktop = false }) {
  return (
    <form
      action={SEARCH_CONFIG.action}
      method="GET"
      className={desktop ? "relative ml-2" : "relative"}
    >
      <input
        type="search"
        name={SEARCH_CONFIG.queryParam}
        placeholder={SEARCH_CONFIG.placeholder}
        className={
          desktop
            ? "w-52 rounded-full border border-[#e3d4b5] bg-[#fffdf8] py-2.5 pl-4 pr-10 text-sm text-[#3b342b] outline-none transition-all placeholder:text-[#9b8a70] focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
            : "w-full rounded-lg border border-[#e3d4b5] bg-[#fffdf8] py-3 pl-4 pr-12 text-sm text-[#3b342b] outline-none placeholder:text-[#9b8a70] focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
        }
      />
      <button
        type="submit"
        aria-label="Search products"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b8a70] hover:text-[#C9A227] transition-colors"
      >
        <Search size={18} />
      </button>
    </form>
  );
}

/* ============================================================
   DESKTOP - LANGUAGE SELECTOR
   ============================================================ */
function LanguageSelector({
  language,
  languages,
  languageOpen,
  setLanguageOpen,
  changeLanguage,
}) {
  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    setLanguageOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setLanguageOpen((prev) => !prev)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg text-gray-700 hover:text-[#C9A227] hover:bg-[#fffdf8] transition-all duration-300"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={languageOpen}
      >
        <Globe size={19} />
        <span className="text-sm font-medium">{languages[language]}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            languageOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {languageOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#e3d4b5] bg-white shadow-lg py-2 z-50"
          role="listbox"
          aria-label="Select language"
        >
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Select Language
          </div>
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLanguageChange(code)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#fffdf8] hover:text-[#C9A227] transition-colors"
              role="option"
              aria-selected={language === code}
            >
              <span>{name}</span>
              {language === code && <Check size={17} className="text-[#C9A227]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MOBILE - LANGUAGE SELECTOR
   ============================================================ */
function MobileLanguageSelector({
  language,
  languages,
  languageOpen,
  setLanguageOpen,
  changeLanguage,
}) {
  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    setLanguageOpen(false);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setLanguageOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 text-gray-800 hover:text-[#C9A227] transition-colors"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={languageOpen}
      >
        <span className="flex items-center gap-3">
          <Globe size={20} />
          <span>Language</span>
        </span>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          {languages[language]}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              languageOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {languageOpen && (
        <div
          className="mt-2 ml-8 rounded-lg border border-[#e3d4b5] bg-[#fffdf8] py-1"
          role="listbox"
          aria-label="Select language"
        >
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLanguageChange(code)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:text-[#C9A227] hover:bg-white transition-colors"
              role="option"
              aria-selected={language === code}
            >
              <span>{name}</span>
              {language === code && <Check size={17} className="text-[#C9A227]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DESKTOP - LOGGED IN (with counts)
   ============================================================ */
function LoggedInDesktop({ user, onLogout, cartCount, wishlistCount }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/wishlist"
        className="text-gray-700 hover:text-[#C9A227] transition-colors"
      >
        ♡ Wishlist {wishlistCount !== null && `(${wishlistCount})`}
      </Link>
      <Link
        href="/cart"
        className="text-gray-700 hover:text-[#C9A227] transition-colors"
      >
        🛒 Cart {cartCount !== null && `(${cartCount})`}
      </Link>
      <Link
        href="/profile"
        title={`Profile: ${user.name}`}
        aria-label="Profile"
        className="flex items-center justify-center w-10 h-10 rounded-full border border-[#e3d4b5] text-gray-700 hover:text-[#C9A227] hover:border-[#C9A227] hover:bg-[#fffdf8] transition-all duration-300"
      >
        <User size={20} />
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="text-gray-700 font-medium hover:text-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

/* ============================================================
   DESKTOP - LOGGED OUT
   ============================================================ */
function LoggedOutDesktop() {
  return (
    <>
      <Link
        href="/login"
        className="flex items-center justify-center h-10 px-4 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-[#C9A227] transition-all duration-300"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="flex items-center justify-center h-10 px-5 rounded-xl bg-[#C9A227] text-white font-medium hover:bg-[#B8860B] transition-all duration-300 hover:scale-105"
      >
        Sign Up
      </Link>
    </>
  );
}

/* ============================================================
   MOBILE - LOGGED IN (with counts)
   ============================================================ */
function LoggedInMobile({ onLogout, onClose, cartCount, wishlistCount }) {
  return (
    <>
      <Link
        href="/wishlist"
        onClick={onClose}
        className="text-gray-800 hover:text-[#C9A227] transition-colors"
      >
        ♡ Wishlist {wishlistCount !== null && `(${wishlistCount})`}
      </Link>
      <Link
        href="/cart"
        onClick={onClose}
        className="text-gray-800 hover:text-[#C9A227] transition-colors"
      >
        🛒 Cart {cartCount !== null && `(${cartCount})`}
      </Link>
      <Link
        href="/profile"
        onClick={onClose}
        className="flex items-center gap-3 text-gray-800 hover:text-[#C9A227] transition-colors"
      >
        <User size={20} />
        <span>My Profile</span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="text-left text-red-600 hover:text-red-700 transition-colors"
      >
        Logout
      </button>
    </>
  );
}

/* ============================================================
   MOBILE - LOGGED OUT
   ============================================================ */
function LoggedOutMobile({ onClose }) {
  return (
    <>
      <Link
        href="/login"
        onClick={onClose}
        className="text-gray-800 hover:text-[#C9A227] transition-colors"
      >
        Login
      </Link>
      <Link
        href="/signup"
        onClick={onClose}
        className="bg-[#C9A227] text-white py-2 rounded-lg text-center hover:bg-[#B8860B] transition-colors"
      >
        Sign Up
      </Link>
    </>
  );
}