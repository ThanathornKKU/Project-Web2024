"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDocs, deleteDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import Navbar from "@/app/components/navbar";
import Link from "next/link";

interface Student {
  stdid: string;
  name: string;
  id: string;
  status: string;
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
      title: "Are you sure?",
      text: "Do you really want to remove this student?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
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
      <title>Scores | Classroom</title>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Navigation Tabs */}
        <Navbar />

        {/* ✅ เนื้อหาหลัก */}
        <div className="flex flex-col items-center mt-6">
          <div className="max-w-9xl w-full bg-white p-8 shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">
              คะแนนเช็คชื่อรวม
            </h2>

            {loading ? (
              <p className="text-gray-600 text-center">Loading students...</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b-2 border-black ">
                    <th className="p-4 font-semibold text-center w-16">
                      ลำดับ
                    </th>
                    <th className="p-3 font-semibold w-1/4 text-center">
                      รหัสนักศึกษา
                    </th>{" "}
                    {/* ✅ ลดขนาด width */}
                    <th className="p-3 font-semibold w-1/2">
                      ชื่อ - นามสกุล
                    </th>{" "}
                    {/* ✅ เพิ่มขนาดให้ชิดกันมากขึ้น */}
                    <th className="p-4 font-semibold text-center w-1/4">
                      คะแนนการเช็คชื่อ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <tr
                        key={student.id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-gray-300"
                        }`}
                      >
                        <td className="p-4 text-center">{index + 1}</td>
                        <td className="p-3 text-center">
                          {student.stdid}
                        </td>{" "}
                        {/* ✅ ลด padding ให้เล็กลง */}
                        <td className="p-3">{student.name}</td>
                        <td className="p-4 text-center">{student.status}</td>
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
      </div>
    </>
  );
}
