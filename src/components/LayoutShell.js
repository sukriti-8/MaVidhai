"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import Chatbot from "@/components/chatbot/Chatbot";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  // Admin pages have their own layout.
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />

      {children}

      <Footer />

      <Chatbot />
    </>
  );
}