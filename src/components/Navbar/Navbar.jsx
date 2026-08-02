"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
            Home
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Shop 
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Categories 
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Deals 
          </Link>
         <Link
          href="/"
          className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
        >
          About 
        </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4">
          <Link
            href="/login"
            className="text-gray-700 hover:text-[#C9A227] transition-colors duration-300"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="bg-[#C9A227] text-white px-5 py-2 rounded-xl hover:bg-[#B8860B] transition-all duration-300 hover:scale-105"
          >
            Sign Up
          </Link>
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
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Home
          </Link>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Shop 
          </Link>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Categories 
          </Link>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            Deals 
          </Link>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-800 hover:text-[#C9A227] transition-colors"
          >
            About 
          </Link>

          <hr />

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
        </div>
      )}
    </nav>
  );
}