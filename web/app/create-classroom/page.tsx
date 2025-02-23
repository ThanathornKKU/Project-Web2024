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

  // ✅ ฟังก์ชัน Resize รูปภาพก่อนแปลงเป็น Base64
  const resizeImage = (file: File, maxWidth = 300, maxHeight = 300) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // ปรับขนาดให้ไม่เกิน maxWidth / maxHeight
          if (width > maxWidth || height > maxHeight) {
            const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scaleFactor);
            height = Math.round(height * scaleFactor);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.8)); // ✅ ลดคุณภาพเหลือ 80%
        };
      };
    });
  };

  // ✅ ฟังก์ชันอัปโหลดรูปภาพและ Resize ก่อนแปลงเป็น Base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        const resizedBase64 = await resizeImage(file);
        setFormData((prev) => ({
          ...prev,
          photo: resizedBase64, // ✅ เก็บรูป Base64 ที่ Resize แล้ว
        }));
      } catch (error) {
        console.error("Error resizing image:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to process image. Please try again.",
          icon: "error",
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "",
        icon: "warning",
        confirmButtonColor: "#FFA500",
      });
      return;
    }

    setSaving(true);
    try {
      const classroomRef = collection(db, "classroom");
      await addDoc(classroomRef, {
        owner: user.uid,
        info: formData,
      });

      Swal.fire({
        title: "สร้างห้องเรียนเสร็จเรียบร้อย!",
        text: "",
        icon: "success",
        confirmButtonColor: "#4CAF50",
      });

      router.push("/");
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
    <>
      <title>Create Classroom</title>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-black">
            สร้างห้องเรียน
          </h2>

          <div className="mt-4">
            <label className="block text-gray-700">รหัสวิชา *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">ชื่อวิชา *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">ห้องเรียน *</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
            />
          </div>

          {/* ✅ อัปโหลดรูปภาพ และแสดงตัวอย่าง */}
          <div className="mt-4">
            <label className="block text-gray-700">รูปภาพห้องเรียน *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
            />
            {formData.photo && (
              <img
                src={formData.photo}
                alt="Preview"
                className="w-full mt-2 rounded-md shadow"
              />
            )}
          </div>

          <button
            onClick={handleSave}
            className={`w-full mt-6 p-2 text-white rounded-lg ${saving
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
    </>
  );
}