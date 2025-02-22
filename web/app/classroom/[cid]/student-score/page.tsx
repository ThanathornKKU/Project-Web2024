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
  status : string;
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
        <title>Students | Classroom</title>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* ✅ เรียกใช้ Navbar */}
        <Navbar />

        <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-4">รายชื่อนักศึกษา</h2>

          {loading ? (
            <p className="text-gray-600">Loading students...</p>
          ) : (
              <table className="w-full border-collapse">
              <thead >
                <tr className="text-left border-b-2 border-black">
                  <th className="p-3 font-semibold">ลำดับ</th> {/* ✅ ลำดับ */}
                  <th className="p-3 font-semibold">รหัสนักศึกษา</th>
                  <th className="p-3 font-semibold">ชื่อ - นามสกุล</th>
                  <th className="p-3 font-semibold text-center">คะแนนการเช็คชื่อ</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}>
                      <td className="p-3">{index + 1}</td> {/* ✅ ลำดับอัตโนมัติ */}
                      <td className="p-3">{student.stdid}</td>
                      <td className="p-3">{student.name}</td>
                      <td className="p-3 text-center">{student.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">
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
