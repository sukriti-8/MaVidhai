"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthToken, setAuthToken, getCart, getWishlist } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { t, currentLanguage, setLanguage } = useTranslation();

  const languages = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
    { code: "ta", label: "தமிழ்" },
    { code: "kn", label: "ಕನ್ನಡ" },
  ];

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
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-4">
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
            {t("Home")}
          </Link>

          <Link
            href="/shop"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            {t("Shop")}
          </Link>

          <Link
            href="/#categories"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            {t("Categories")}
          </Link>

          <Link
            href="/#about"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            {t("About")}
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 text-gray-700 hover:text-[#C9A227] font-medium transition-colors cursor-pointer"
            >
              🌐 {languages.find(l => l.code === currentLanguage)?.label || "English"} ▾
            </button>
            {langDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuth ? (
            <>
              <Link href="/orders" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                {t("Orders")}
              </Link>
              <Link href="/wishlist" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                ♡ {t("Wishlist")} {wishlistCount !== null && `(${wishlistCount})`}
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-[#C9A227] font-medium transition-colors">
                🛒 {t("Cart")} {cartCount !== null && `(${cartCount})`}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 px-4 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-red-500 transition-all duration-300 ml-2"
              >
                {t("Logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center justify-center h-10 px-4 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-[#C9A227] transition-all duration-300"
              >
                {t("Login")}
              </Link>

              <Link
                href="/signup"
                className="flex items-center justify-center h-10 px-5 rounded-xl bg-[#C9A227] text-white font-medium hover:bg-[#B8860B] transition-all duration-300 hover:scale-105"
              >
                {t("Sign Up")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-8 py-4 bg-white border-t border-gray-200 text-gray-800">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <span className="font-medium text-gray-500">Language:</span>
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-gray-700 font-medium outline-none cursor-pointer"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            {t("Home")}
          </Link>

          <Link
            href="/shop"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            {t("Shop")}
          </Link>

          <Link
            href="/#categories"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            {t("Categories")}
          </Link>

          <Link
            href="/#about"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            {t("About")}
          </Link>

          <hr />

          {isAuth ? (
            <>
              <Link
                href="/orders"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                {t("Orders")}
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                ♡ {t("Wishlist")} {wishlistCount !== null && `(${wishlistCount})`}
              </Link>

              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                🛒 {t("Cart")} {cartCount !== null && `(${cartCount})`}
              </Link>

              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left text-gray-800 hover:text-red-500 transition-colors"
              >
                {t("Logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-gray-800 hover:text-[#C9A227] transition-colors"
              >
                {t("Login")}
              </Link>

              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="bg-[#C9A227] text-white py-2 rounded-lg text-center hover:bg-[#B8860B] transition-colors"
              >
                {t("Sign Up")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}