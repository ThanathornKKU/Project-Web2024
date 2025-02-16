"use client";
import React, { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface ClassroomInfo {
  code: string;
  name: string;
  photo: string; // ✅ เก็บรูปเป็น Base64
  room: string;
}

export default function CreateClassroom() {
  const user = auth.currentUser;
  const router = useRouter();

  const [formData, setFormData] = useState<ClassroomInfo>({
    code: "",
    name: "",
    photo: "",
    room: "",
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ ฟังก์ชันแปลงรูปเป็น Base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: reader.result as string, // ✅ เก็บ Base64 ใน state
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Swal.fire({
        title: "Unauthorized!",
        text: "You need to be logged in to create a classroom.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!formData.code || !formData.name || !formData.photo || !formData.room) {
      Swal.fire({
        title: "Missing Fields!",
        text: "Please fill in all fields before submitting.",
        icon: "warning",
        confirmButtonColor: "#FFA500",
      });
      return;
    }

    setSaving(true);
    try {
      const classroomRef = collection(db, "classroom");
      await addDoc(classroomRef, {
        owner: user.uid, // ✅ เก็บ UID ของเจ้าของห้องเรียน
        info: formData,  // ✅ บันทึกข้อมูลห้องเรียน
      });

      Swal.fire({
        title: "Success!",
        text: "Classroom has been created successfully.",
        icon: "success",
        confirmButtonColor: "#4CAF50",
      });

      router.push("/"); // ✅ กลับไปหน้า Home
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to create classroom. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
      console.error("Error creating classroom:", error);
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Create Classroom
        </h2>

        <div className="mt-4">
          <label className="block text-gray-700">Class Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md mt-1"
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Class Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md mt-1"
          />
        </div>

        {/* ✅ อัปโหลดรูปภาพ และแสดงตัวอย่าง */}
        <div className="mt-4">
          <label className="block text-gray-700">Classroom Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md mt-1"
          />
          {formData.photo && (
            <img
              src={formData.photo}
              alt="Preview"
              className="w-full mt-2 rounded-md shadow"
            />
          )}
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Room Name</label>
          <input
            type="text"
            name="room"
            value={formData.room}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md mt-1"
          />
        </div>

        <button
          onClick={handleSave}
          className={`w-full mt-6 p-2 text-white rounded-lg ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
          disabled={saving}
        >
          {saving ? "Saving..." : "Create Classroom"}
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
