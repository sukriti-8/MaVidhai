import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import Chatbot from "@/components/chatbot/Chatbot";
import { LanguageProvider } from "@/context/LanguageProvider"; // ⚠️ VERIFY this import path

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MaVidhai",
  description: "Premium ethnic wear and handcrafted fashion.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <Navbar />
          {children}
          <Footer />
          <Chatbot />
        </LanguageProvider>
      </body>
    </html>
  );
}