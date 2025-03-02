import React from "react";
import NavbarHead from "./NavbarHead"; // ✅ นำเข้า Navbar

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-w-[400px]">
      <NavbarHead />
      <main>{children}</main>
    </div>
  );
}