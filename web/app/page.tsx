"use client";
import React, { useEffect, useState } from "react";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

interface UserProfile {
  name: string;
  photo: string;
}

interface Classroom {
  id: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setClassrooms([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (currentUser: User) => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      setUserProfile({
        name: data.name || "Unknown User",
        photo: data.photo || "https://via.placeholder.com/100",
      });

      // ดึงรายชื่อห้องเรียนจาก users/{uid}/classroom
      const classList = Object.keys(data.classroom || {}).map((cid) => ({
        id: cid,
      }));
      setClassrooms(classList);
    } else {
      await setDoc(userRef, {
        name: currentUser.displayName ?? "Unknown User",
        email: currentUser.email ?? "No Email",
        photo: currentUser.photoURL ?? "",
        classroom: {},
      });
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setClassrooms([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {!user ? (
        <button
          onClick={login}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
        >
          Login with Google
        </button>
      ) : (
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
          {/* ข้อมูลผู้ใช้ */}
          <div className="flex items-center space-x-4">
            <img
              src={userProfile?.photo}
              alt="Profile"
              className="w-16 h-16 rounded-full border border-gray-300"
            />
            <div>
              <h1 className="text-xl font-semibold">{userProfile?.name}</h1>
              <p className="text-gray-600">{user.email ?? "No Email"}</p>
            </div>
          </div>

          {/* ปุ่มต่างๆ */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
            >
              Logout
            </button>
            <Link
              href="/create-classroom"
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
            >
              Add Classroom
            </Link>
            <Link
              href="/edit-profile"
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600"
            >
              Edit Profile
            </Link>
          </div>

          {/* รายชื่อห้องเรียน */}
          <h2 className="mt-6 text-lg font-semibold">Your Classrooms</h2>
          <ul className="mt-4 space-y-2">
            {classrooms.length > 0 ? (
              classrooms.map((classroom) => (
                <li
                  key={classroom.id}
                  className="flex justify-between items-center bg-gray-200 p-3 rounded-lg shadow-sm"
                >
                  <span>Classroom ID: {classroom.id}</span>
                  <Link
                    href={`/classroom/${classroom.id}`}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Manage
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No classrooms yet.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}