"use client";

import Link from "next/link";
<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

const AUTH_STORAGE_KEY = "mavidhai_user";

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

const AUTH_EVENT = "mavidhai-auth-changed";

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  /*
   * Read the logged-in user from localStorage.
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
   * Load the user when Navbar first appears
   * and listen for login/logout changes.
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
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    window.dispatchEvent(new Event(AUTH_EVENT));

    setMenuOpen(false);

    router.push("/");
  };

  /*
   * Close mobile menu.
   */
  const closeMobileMenu = () => {
    setMenuOpen(false);
=======
import { useState, useEffect } from "react";
import { getAuthToken, setAuthToken, getCart, getWishlist } from "@/lib/api";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  const loadData = async () => {
    if (!getAuthToken()) {
      setIsAuth(false);
      setCartCount(null);
      setWishlistCount(null);
      return;
    }
    setIsAuth(true);
    
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

  useEffect(() => {
    loadData();

    const handleCartUpdate = () => {
      if (getAuthToken()) {
        getCart()
          .then(cart => setCartCount(cart.item_count))
          .catch(e => {
            if (e.message === "Unauthorized") setAuthToken(null);
          });
      }
    };
    
    const handleWishlistUpdate = () => {
      if (getAuthToken()) {
        getWishlist()
          .then(wishlist => setWishlistCount(wishlist.count))
          .catch(e => {
            if (e.message === "Unauthorized") setAuthToken(null);
          });
      }
    };
    
    const handleAuthChanged = () => {
      loadData();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("wishlist-updated", handleWishlistUpdate);
    window.addEventListener("auth-changed", handleAuthChanged);
    
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
>>>>>>> origin/backend-development
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-4">
<<<<<<< HEAD
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
              {link.label}
            </Link>
          ))}

          {/* Desktop Search */}
          <SearchForm desktop />
        </div>

        {/* ================= DESKTOP AUTH ================= */}

        <div className="hidden md:flex items-center gap-3">

          {user ? (
            <LoggedInDesktop
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <LoggedOutDesktop />
          )}

        </div>

        {/* ================= MOBILE MENU BUTTON ================= */}

        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
=======
      {/* Desktop Navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-[#C9A227] hover:scale-105 transition-all duration-300"
        >
          MaVidhai
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Shop
          </Link>

          <Link
            href="/#categories"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Categories
          </Link>

          <Link
            href="/#about"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            About
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuth ? (
            <>
              <Link href="/orders" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                Orders
              </Link>
              <Link href="/wishlist" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                ♡ Wishlist {wishlistCount !== null && `(${wishlistCount})`}
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                🛒 Cart {cartCount !== null && `(${cartCount})`}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 px-4 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-red-500 transition-all duration-300 ml-2"
              >
                Logout
              </button>
            </>
          ) : (
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
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
>>>>>>> origin/backend-development
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
<<<<<<< HEAD

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
              {link.label}
            </Link>
          ))}

          <hr />

          {/* Mobile Authentication */}

          {user ? (
            <LoggedInMobile
              onLogout={handleLogout}
              onClose={closeMobileMenu}
            />
          ) : (
            <LoggedOutMobile
              onClose={closeMobileMenu}
            />
          )}

=======
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-8 py-4 bg-white border-t border-gray-200 text-gray-800">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Home
          </Link>

          <Link
            href="/shop"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Shop
          </Link>

          <Link
            href="/#categories"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Categories
          </Link>

          <Link
            href="/#about"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            About
          </Link>

          <hr />

          {isAuth ? (
            <>
              <Link
                href="/orders"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                Orders
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                ♡ Wishlist {wishlistCount !== null && `(${wishlistCount})`}
              </Link>

              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                🛒 Cart {cartCount !== null && `(${cartCount})`}
              </Link>

              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left text-gray-800 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                Login
              </Link>

              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="bg-[#C9A227] text-white py-2 rounded-lg text-center hover:bg-[#B8860B] transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
>>>>>>> origin/backend-development
        </div>
      )}
    </nav>
  );
<<<<<<< HEAD
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
   DESKTOP - LOGGED IN
   ============================================================ */

function LoggedInDesktop({ user, onLogout }) {
  return (
    <div className="flex items-center gap-3">

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
   MOBILE - LOGGED IN
   ============================================================ */

function LoggedInMobile({ onLogout, onClose }) {
  return (
    <>
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
=======
>>>>>>> origin/backend-development
}