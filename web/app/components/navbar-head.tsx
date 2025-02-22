"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut, db } from "@/lib/firebase"; // ตรวจสอบว่า db ถูก export มาจาก firebase ด้วย
import { onSnapshot, doc } from "firebase/firestore";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    photo: "",
    email: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe เพื่อติดตาม auth state
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // เมื่อมี user แล้ว subscribe ไปยัง Firestore document
  useEffect(() => {
    if (user?.uid) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              name: data.name || "Unknown User",
              photo:
                data.photo ||
                "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg",
              email: data.email || "No Email",
            });
          }
        },
        (error) => {
          console.error("Error in onSnapshot:", error);
        }
      );
      return () => unsubscribeSnapshot();
    }
  }, [user]);

  // ปิด dropdown เมื่อคลิกนอกพื้นที่ dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      {/* Container ที่ครอบคลุมเต็มความกว้าง */}
      <div className="w-full flex justify-between items-center h-20 px-10">
        {/* ข้อความ MyApp อยู่ด้านซ้าย */}
        <Link
          href="/"
          onClick={() => setDropdownOpen(false)}
          className="text-3xl font-bold"
        >
          {/* Dream Petch Pond Auto Web Application Classrooms */}
          Classroom X
        </Link>

        {/* ส่วนข้อมูลผู้ใช้ที่เป็น dropdown อยู่ด้านขวา */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center focus:outline-none"
          >
            {/* <Image
              src={userProfile.photo}
              alt="Profile"
              width={50}
              height={50}
              className="rounded-full border border-gray-300"
            /> */}
            {userProfile.photo && (
              <Image
                src={userProfile.photo}
                alt="Profile"
                width={50}
                height={50}
                className="rounded-full border border-gray-300"
              />
            )}

          </button>
          {/* {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-black rounded-md shadow-lg py-1 z-10">
              ข้อมูลผู้ใช้
              <div className="px-6 py-3 border-b">
                <h1 className="text-xl font-semibold">{userProfile.name}</h1>
                <p className="text-base text-gray-600">{userProfile.email}</p>
              </div>
              <Link
                href="/edit-profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-6 py-3 hover:bg-gray-200 text-base"
              >
                Edit Profile
              </Link>
              <Link
                href="/"
                onClick={logout}
                className="block px-6 py-3 hover:bg-gray-200 text-base"
              >
                Logout
              </Link>
            </div>
          )} */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-black rounded-md shadow-lg py-1 z-10">
              {/* ข้อมูลผู้ใช้ */}
              <div className="px-6 py-3 border-b">
                <h1 className="text-xl font-semibold break-words">{userProfile.name}</h1>
                <p className="text-base text-gray-600 break-words">{userProfile.email}</p>
              </div>
              <Link
                href="/edit-profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-6 py-3 hover:bg-gray-200 text-base w-full max-w-md flex items-center justify-start gap-3"
              >
                <img src="/edit.png" alt="edit icon" className="w-5 h-5" />
                <span>Edit Profile</span>
              </Link>
              <Link
                href="/"
                onClick={logout}
                className="block px-6 py-3 hover:bg-gray-200 text-base w-full max-w-md flex items-center justify-start gap-3"
              >
                <img src="/exit.png" alt="exit icon" className="w-5 h-5" />
                <span>Logout</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
