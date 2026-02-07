"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { 
  Home, 
  Users, 
  FileText, 
  Shield, 
  Scale, 
  HelpCircle,
  LogOut,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (err: any) {
      console.error("Sign out failed", err);
      setError("Sign out failed. Please try again.");
      setLoading(false);
    }
  }

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/docs", label: "Documents", icon: FileText },
    { href: "/consent", label: "Consent", icon: Shield },
    { href: "/rights", label: "Rights", icon: Scale },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Chain<span className="text-red-600">Alert</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive(item.href) ? "text-blue-600" : "text-gray-400"}`} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Sign Out Button */}
              <div className="ml-4 pl-4 border-l border-gray-200">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {loading ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive(item.href) ? "text-blue-600" : "text-gray-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}

                {/* Mobile Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {loading ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}
      </nav>

      {/* Add padding to main content when navbar is sticky */}
      <style jsx global>{`
        main {
          scroll-padding-top: 4rem; /* Height of navbar */
        }
      `}</style>
    </>
  );
}