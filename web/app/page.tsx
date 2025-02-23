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
    try {
      // 🔹 1) ดึง classroom IDs จาก users/{uid}/classroom
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        console.warn("User data not found.");
        setClassrooms([]);
        return;
      }
  
      const userData = userSnap.data();
      const classroomIds = userData.classroom ? Object.keys(userData.classroom) : [];
  
      if (classroomIds.length === 0) {
        console.log("User is not in any classrooms.");
        setClassrooms([]);
        return;
      }
  
      // 🔹 2) ดึงข้อมูลห้องเรียนที่ user มีอยู่ใน Firestore
      const classCollection = collection(db, "classroom");
      const q = query(classCollection, where("__name__", "in", classroomIds)); // ✅ ดึง classroom ที่ user มีอยู่
      const classSnapshot = await getDocs(q);
  
      const classList = classSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Classroom, "id">),
      }));
  
      setClassrooms(classList);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setClassrooms([]);
    }
  };
  

  // const login = async () => {
  //   try {
  //     await signInWithPopup(auth, provider);
  //   } catch (error) {
  //     console.error("Login error:", error);
  //   }
  // };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const logingoogle = async () => {
    // ถ้า isLoggingIn เป็น true ให้หยุดทำงาน (ป้องกันการเรียกซ้ำ)
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Popup ถูกปิดโดยผู้ใช้, login ถูกยกเลิก");
      } else if (error.code === "auth/cancelled-popup-request") {
        console.log("Popup request ถูกยกเลิก");
      } else {
        console.error("Login error:", error);
      }
    } finally {
      setIsLoggingIn(false);
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
        <>
          <title>Login</title>
          <div className="min-h-[90vh] w-full flex items-center justify-center bg-gray-100 p-6">
          <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-10 flex flex-col items-center justify-center">
            <div className="py-10 w-full flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-semibold mb-6 text-black">Classroom X</h2>
              <h2 className="text-2xl font-medium mb-8 text-gray-700">เพราะ X เป็นได้ทุกอย่าง</h2>

              {/* Google Login Button */}
              <button
                onClick={logingoogle}
                className="w-full max-w-md flex items-center justify-center gap-3 px-8 py-3 bg-white text-black font-semibold rounded-xl shadow-md border hover:bg-blue-600 hover:text-white transition-colors duration-200 mb-4"
              >
                <img src="/google-icon.png" alt="Google Icon" className="w-7 h-7" />
                <span>Login with Google</span>
              </button>

              {/* Phone Login Button */}
              <button
                // onClick={logingoogle}
                className="w-full max-w-md flex items-center justify-center gap-3 px-8 py-3 bg-white text-black font-semibold rounded-xl shadow-md border hover:bg-blue-600 hover:text-white transition-colors duration-200"
              >
                <img src="/phone-icon.png" alt="Phone Icon" className="w-7 h-7" />
                <span>Login with Phone</span>
              </button>

              <div id="recaptcha-container"></div>
            </div>
          </div>
          </div>
        </>
      ) : (
        <>
          <title>Home</title>
          <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg px-8 pt-0 pb-8 lg:px-20 lg:pt-6 lg:pb-16 lg:mt-6"
          >

            {/* ปุ่ม Add Classroom */}
            <div className="flex justify-between items-center mt-6">
              <h2 className="text-2xl font-semibold text-black">Your Classrooms</h2>
              <Link
                href="/create-classroom"
                className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
              >
                + Add Classroom
              </Link>
            </div>

            {/* รายชื่อห้องเรียน */}
            <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {classrooms.length > 0 ? (
                classrooms.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="bg-white shadow-md rounded-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-2xl"
                  >
                    <Image
                      src={
                        isBase64(classroom.info.photo)
                          ? classroom.info.photo
                          : classroom.info.photo || "https://via.placeholder.com/150"
                      }
                      alt="Classroom"
                      width={56}
                      height={56}
                      className="w-full h-40 object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = "https://via.placeholder.com/150")
                      }
                    />
                    <div className="px-4 pt-2 pb-4">
                      <h3 className="text-lg font-semibold text-black">
                        {classroom.info.name || "No Name"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        รหัสวิชา: {classroom.info.code || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        ห้องเรียน: {classroom.info.room || "N/A"}
                      </p>
                      <Link
                        href={`/classroom/${classroom.id}`}
                        className="mt-3 block px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600"
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
        </>
      )}
    </div>
  );
}
