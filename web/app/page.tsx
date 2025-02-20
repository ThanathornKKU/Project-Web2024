"use client";
import React, { useEffect, useState } from "react";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

// Interface ของ Classroom
interface ClassroomInfo {
  code: string;
  name: string;
  photo: string;
  room: string;
}

interface Classroom {
  id: string;
  owner: string;
  info: ClassroomInfo;
}

interface UserProfile {
  name: string;
  photo: string;
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
        await fetchClassrooms(currentUser.uid);
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
        photo: data.photo || "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg",
      });
    } else {
      await setDoc(userRef, {
        name: currentUser.displayName ?? "Unknown User",
        email: currentUser.email ?? "No Email",
        photo: currentUser.photoURL ?? "",
      });
    }
  };

  const fetchClassrooms = async (uid: string) => {
    const classCollection = collection(db, "classroom");
    const q = query(classCollection, where("owner", "==", uid)); // ✅ ดึงเฉพาะห้องเรียนของ user
    const classSnapshot = await getDocs(q);
    const classList = classSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Classroom, "id">),
    }));
    setClassrooms(classList);
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

  const isBase64 = (photo: string) => {
    return /^data:image\/[a-z]+;base64,/.test(photo);
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
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
          {/* ข้อมูลผู้ใช้ */}
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <Image
                src={userProfile?.photo ?? "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg"}
                alt="Profile"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full border border-gray-300"
              />
              <div>
                <h1 className="text-xl font-semibold">{userProfile?.name}</h1>
                <p className="text-gray-600">{user.email ?? "No Email"}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/edit-profile"
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          </div>

          {/* ปุ่ม Add Classroom */}
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-2xl font-semibold">Your Classrooms</h2>
            <Link
              href="/create-classroom"
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
            >
              + Add Classroom
            </Link>
          </div>

          {/* รายชื่อห้องเรียน */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            {classrooms.length > 0 ? (
              classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="bg-white shadow-md rounded-lg overflow-hidden"
                >
                  {/* ✅ รองรับ Base64 หรือ URL */}
                  <Image
                    src={
                      isBase64(classroom.info.photo)
                        ? classroom.info.photo
                        : classroom.info.photo || "https://via.placeholder.com/150"
                    }
                    alt="Classroom"
                    width={56}
                    height={56}
                    className="w-full h-32 object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "https://via.placeholder.com/150")
                    }
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">
                      {classroom.info.name || "No Name"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Code: {classroom.info.code || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Room: {classroom.info.room || "N/A"}
                    </p>
                    <Link
                      href={`/classroom/${classroom.id}`}
                      className="mt-2 block px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-3">
                No classrooms available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
