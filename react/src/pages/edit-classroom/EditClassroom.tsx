import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ✅ ใช้ react-router-dom
import { auth, db } from "../../lib/firebase"; // ✅ แก้ path Firebase
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";

interface ClassroomInfo {
  code: string;
  name: string;
  photo: string;
  room: string;
}

export default function EditClassroom() {
  const { cid } = useParams(); // ✅ ดึง `cid` จาก URL
  const user = auth.currentUser;
  const navigate = useNavigate(); // ✅ ใช้ `useNavigate()`
  
  const [formData, setFormData] = useState<ClassroomInfo>({
    code: "",
    name: "",
    photo: "",
    room: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (user && cid) {
      fetchClassroomData(cid);
    }
  }, [user, cid]);

  const fetchClassroomData = async (classroomId: string) => {
    setLoading(true);
    try {
      const classroomRef = doc(db, "classroom", classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (classroomSnap.exists()) {
        const data = classroomSnap.data();
        setFormData(data.info);
        setIsOwner(data.owner === user?.uid);
      } else {
        Swal.fire({
          title: "Error!",
          text: "Classroom not found.",
          icon: "error",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error);
    }
    setLoading(false);
  };

  const resizeImage = (file: File, maxWidth = 500, maxHeight = 500) => {
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

          if (width > maxWidth || height > maxHeight) {
            const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scaleFactor);
            height = Math.round(height * scaleFactor);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        const resizedBase64 = await resizeImage(file);
        setFormData((prev) => ({
          ...prev,
          photo: resizedBase64,
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
    if (!user || !cid || !isOwner) {
      Swal.fire({
        title: "Unauthorized!",
        text: "You are not allowed to edit this classroom.",
        icon: "error",
      });
      return;
    }

    if (!formData.code || !formData.name || !formData.photo || !formData.room) {
      Swal.fire({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน!",
        text: "",
        icon: "warning",
        confirmButtonColor: "#FFA500",
      });
      return;
    }

    setSaving(true);
    try {
      const classroomRef = doc(db, "classroom", cid);
      await updateDoc(classroomRef, {
        info: formData,
      });

      Swal.fire({
        title: "บันทึกสำเร็จ!",
        text: "Classroom has been updated.",
        icon: "success",
        confirmButtonColor: "#4CAF50",
      });

      navigate(`/classroom/${cid}`);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to update classroom. Please try again.",
        icon: "error",
      });
      console.error("Error updating classroom:", error);
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
      <title>Edit Classroom</title>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-black">แก้ไขห้องเรียน</h2>

          {!isOwner ? (
            <p className="text-red-500 text-center">คุณไม่มีสิทธิ์แก้ไขห้องเรียนนี้</p>
          ) : (
            <>
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

              <div className="mt-4">
                <label className="block text-gray-700">รูปภาพห้องเรียน *</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black" />
                {formData.photo && <img src={formData.photo} alt="Preview" className="w-full mt-2 rounded-md shadow" />}
              </div>

              <button onClick={handleSave} className={`w-full mt-6 p-2 text-white rounded-lg ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}