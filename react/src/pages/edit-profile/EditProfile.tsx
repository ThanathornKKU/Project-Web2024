import React, { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase"; // ✅ แก้ path Firebase
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // ✅ ใช้ react-router-dom
import Swal from "sweetalert2";

export default function EditProfile() {
  const user = auth.currentUser;
  const navigate = useNavigate(); // ✅ ใช้ `useNavigate()`
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid);
    }
  }, [user]);

  const fetchUserData = async (uid: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || "");
        setEmail(data.email || "");
        setPhoto(data.photo || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setLoading(false);
  };

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // ✅ ลดขนาดรูปเป็น 500x500px ก่อนแปลงเป็น Base64
      const resizedBase64 = await resizeImage(selectedFile, 500, 500);
      setPhoto(resizedBase64);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name,
        email,
        photo,
      });

      Swal.fire({
        title: "Success!",
        text: "Your profile has been updated.",
        icon: "success",
        confirmButtonColor: "#4CAF50",
        timer: 3000,
      });

      navigate("/"); // ✅ กลับไปหน้า Home
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update profile. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <title>Edit Profile</title>
      <div className="min-h-[90vh] flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Edit Profile
          </h2>
          <div className="flex flex-col items-center space-y-4">
            <img
              src={photo || "https://via.placeholder.com/100"}
              alt="Profile"
              className="w-24 h-24 rounded-full border border-gray-300 object-cover"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
            >
              Upload Photo
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full p-2 border border-gray-300 text-gray-400 rounded-md mt-1"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full mt-6 p-2 text-white rounded-lg ${saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
              }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <div className="mt-4 text-center">
            <button onClick={() => navigate("/")} className="text-blue-500 hover:underline">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}