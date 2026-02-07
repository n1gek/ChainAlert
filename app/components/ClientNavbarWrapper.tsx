"use client";
import Navbar from "./Navbar";
import { usePathname } from "next/navigation";

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  const showNavbar = pathname.startsWith("/home") || pathname.startsWith("/contacts") || pathname.startsWith("/docs") || pathname.startsWith("/consent") || pathname.startsWith("/rights") || pathname.startsWith("/how-it-works");
  return showNavbar ? <Navbar /> : null;
}
