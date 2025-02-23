"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDocs, deleteDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { FiMinusCircle } from "react-icons/fi"; // ✅ ใช้ไอคอนตาม mockup
import Navbar from "@/app/components/navbar";

interface Student {
  stdid: string;
  name: string;
  id: string;
}

export default function ShowStudents() {
  const { cid } = useParams<{ cid: string }>(); // ดึง `cid` จาก URL
  const user = auth.currentUser;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cid) {
      fetchStudents(cid);
    }
  }, [cid]);

  const fetchStudents = async (classroomId: string) => {
    setLoading(true);
    try {
      const studentsRef = collection(db, `classroom/${classroomId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsList = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (studentId: string) => {
    if (!user) {
      Swal.fire(
        "Unauthorized!",
        "You are not allowed to delete students.",
        "error"
      );
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "คุณกำลังจะลบรายชื่อนักเรียน!",
      text: "ต้องการที่จะลบรายชื่อนักเรียนใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (confirmDelete.isConfirmed) {
      try {
        await deleteDoc(doc(db, `classroom/${cid}/students`, studentId));
        setStudents((prev) =>
          prev.filter((student) => student.id !== studentId)
        );

        Swal.fire("Deleted!", "Student has been removed.", "success");
      } catch (error) {
        Swal.fire(
          "Error!",
          "Failed to remove student. Please try again.",
          "error"
        );
        console.error("Error deleting student:", error);
      }
    }
  };

  return (
    <>
      <title>Show Students | Classroom</title>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* ✅ ใช้ Navbar เหมือนกันทุกหน้า */}
        <Navbar />

        <div className="max-w-9xl mx-auto bg-white p-6 shadow-lg rounded-lg mt-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            รายชื่อนักศึกษา
          </h2>

          {loading ? (
            <p className="text-gray-600">Loading students...</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b-2 border-black ">
                  <th className="p-4 font-semibold text-center w-16">ลำดับ</th>
                  <th className="p-3 font-semibold w-1/4 text-center">
                    รหัสนักศึกษา
                  </th>
                  <th className="p-3 font-semibold w-1/2">ชื่อ - นามสกุล</th>
                  <th className="p-4 font-semibold text-center w-1/4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <tr
                      key={student.id}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-gray-100" : "bg-gray-300"
                      }`}
                    >
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-3 text-center">{student.stdid}</td>
                      <td className="p-3">{student.name}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-gray-600 hover:text-red-500 transition"
                        >
                          <FiMinusCircle size={23} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-6 text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
