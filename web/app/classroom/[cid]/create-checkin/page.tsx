"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import Link from "next/link";

// ✅ ใช้ TypeScript ให้ชัดเจน
interface Params {
  [key: string]: string | undefined;
  cid?: string;
}

interface Student {
  id: string;
  stdid: string;
  name: string;
}

export default function CreateCheckinPage() {
  const { cid } = useParams<Params>();
  const router = useRouter();
  const user = auth.currentUser; // ✅ ดึงข้อมูลผู้ใช้ปัจจุบัน
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);

  // ✅ โหลดรายชื่อนักเรียนที่ลงทะเบียนในรายวิชา
  useEffect(() => {
    if (cid) {
      fetchStudents(cid);
    }
  }, [cid]);

  const fetchStudents = async (classroomId: string) => {
    try {
      const studentsRef = collection(db, `classroom/${classroomId}/students`);
      const studentSnapshot = await getDocs(studentsRef);
      const studentList = studentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // ✅ ฟังก์ชัน handleSave ตรวจสอบ auth.currentUser ก่อนบันทึก
  const handleSave = async (): Promise<void> => {
    if (!user) {
      Swal.fire({
        title: "Unauthorized!",
        text: "กรุณาเข้าสู่ระบบก่อนทำรายการ",
        icon: "error",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!code.trim() || !date.trim() || !cid) {
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
      // ✅ เพิ่ม Check-in ลง Firestore
      const checkinRef = collection(db, "classroom", cid!, "checkin");
      const newCheckin = await addDoc(checkinRef, {
        code,
        date,
        status: 0, // ✅ ตั้งค่าเริ่มต้นเป็น 0
        students: {}, // สร้าง Object เปล่าๆ ก่อน
      });

      // ✅ อัปเดตข้อมูล Check-in ให้มีนักเรียนทั้งหมด
      const checkinDocRef = doc(db, "classroom", cid!, "checkin", newCheckin.id);
      const studentData = students.reduce((acc, student) => {
        acc[student.id] = {
          uid: student.id,
          stdid: student.stdid,
          name: student.name,
          score: 0,
          remark: "",
          date: "",
          status: 0, // 0 = ยังไม่เข้าเรียน
        };
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(checkinDocRef, { students: studentData });

      Swal.fire({
        title: "Check-in ถูกบันทึกแล้ว!",
        text: "",
        icon: "success",
        confirmButtonColor: "#4CAF50",
      });

      router.push(`/classroom/${cid}`);
    } catch (error) {
      console.error("Error saving check-in:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to create check-in. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }

    setSaving(false);
  };

  return (
    <>
      <title>Create Check-in</title>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          {/* ปุ่มย้อนกลับ */}
          <Link href={`/classroom/${cid}`} className="text-green-600 flex items-center mb-4">
            ← Back
          </Link>

          <h2 className="text-2xl font-bold text-center mb-6 text-black">
            Add Check-in
          </h2>

          {/* ฟิลด์กรอกข้อมูล */}
          <div className="mb-4">
            <label className="block text-gray-700">Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
              placeholder="Enter check-in code"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Date *</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 text-black"
            />
          </div>

          {/* แสดงจำนวนนักเรียนที่ลงทะเบียน */}
          <p className="text-gray-600 text-sm mb-4">
            นักเรียนทั้งหมดในรายวิชานี้: <span className="font-bold">{students.length}</span> คน
          </p>

          {/* ปุ่มบันทึก */}
          <button
            onClick={handleSave}
            className={`w-full mt-6 p-2 text-white rounded-lg ${saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Check-in"}
          </button>
        </div>
      </div>
    </>
  );
}