import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { auth, signOut, db } from "../lib/firebase";
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

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

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
              photo: data.photo || "https://via.placeholder.com/150",
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <nav className="bg-gray-900 text-white shadow-md border-b border-gray-700">
      <div className="w-full flex justify-between items-center h-16 px-10">
        <Link to="/" onClick={() => setDropdownOpen(false)} className="text-2xl font-bold">
          Classroom X
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center focus:outline-none">
            {userProfile.photo && (
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border text-black rounded-md shadow-lg py-1 z-10">
              <div className="px-6 py-3 border-b">
                <h1 className="text-xl font-semibold break-words">{userProfile.name}</h1>
                <p className="text-base text-gray-600 break-words">{userProfile.email}</p>
              </div>
              <Link to="/edit-profile" onClick={() => setDropdownOpen(false)} className="block px-6 py-3 hover:bg-gray-200 text-base flex items-center">
                <img src="/edit.png" alt="edit icon" className="w-5 h-5 mr-3" />
                Edit Profile
              </Link>
              <button onClick={logout} className="w-full text-left px-6 py-3 hover:bg-gray-200 text-base flex items-center">
                <img src="/exit.png" alt="exit icon" className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}