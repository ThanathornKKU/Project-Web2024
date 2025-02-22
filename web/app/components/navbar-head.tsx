"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/firebase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    photo: "",
    email: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserProfile({
          name: currentUser.displayName || "Unknown User",
          photo:
            currentUser.photoURL ||
            "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg",
          email: currentUser.email || "No Email",
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo หรือ Navigation links อื่น ๆ */}
        <Link href="/" className="text-xl font-bold">
          MyApp
        </Link>

        {/* ส่วนข้อมูลผู้ใช้ที่เป็น dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center focus:outline-none"
          >
            <Image
              src={userProfile.photo}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full"
            />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-md shadow-lg py-2 z-10">
              {/* ข้อมูลผู้ใช้ */}
              <div className="px-4 py-2 border-b">
                <h1 className="text-lg font-semibold">{userProfile.name}</h1>
                <p className="text-sm text-gray-600">{userProfile.email}</p>
              </div>
              <Link
                href="/edit-profile"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
