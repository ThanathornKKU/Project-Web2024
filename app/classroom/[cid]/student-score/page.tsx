"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "@/app/components/navbar";

interface Student {
  stdid: string;
  name: string;
  id: string;
  totalScore: number;
}

export default function ShowStudents() {
  const { cid } = useParams<{ cid: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cid) {
      fetchStudentScores(cid);
    }
  }, [cid]);

  const fetchStudentScores = async (classroomId: string) => {
    setLoading(true);
    try {
      const studentsRef = collection(db, `classroom/${classroomId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);

      let studentsList = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        totalScore: 0,
      })) as Student[];

      const checkinsRef = collection(db, `classroom/${classroomId}/checkin`);
      const checkinsSnapshot = await getDocs(checkinsRef);

      for (const checkinDoc of checkinsSnapshot.docs) {
        const checkinId = checkinDoc.id;
        const checkinStudentsRef = collection(
          db,
          `classroom/${classroomId}/checkin/${checkinId}/students`
        );
        const checkinStudentsSnapshot = await getDocs(checkinStudentsRef);

        checkinStudentsSnapshot.docs.forEach((studentDoc) => {
          const studentData = studentDoc.data();
          const studentId = studentData.stdid;

          studentsList = studentsList.map((student) =>
            student.stdid === studentId
              ? { ...student, totalScore: student.totalScore + Number(studentData.score || 0) }
              : student
          );
        });
      }

      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
    setLoading(false);
  };

  return (
    <>
      <title>Scores | Classroom</title>
      <div className="min-h-screen bg-gray-100 p-6">
        <Navbar />
        <div className="flex flex-col items-center mt-6">
          <div className="max-w-9xl w-full bg-white p-8 shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">คะแนนเช็คชื่อรวม</h2>

            {loading ? (
              <p className="text-gray-600 text-center">Loading students...</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b-2 border-black">
                    <th className="p-4 font-semibold text-center w-16">ลำดับ</th>
                    <th className="p-3 font-semibold w-1/4 text-center">รหัสนักศึกษา</th>
                    <th className="p-3 font-semibold w-1/2">ชื่อ - นามสกุล</th>
                    <th className="p-4 font-semibold text-center w-1/4">คะแนนรวมการเช็คชื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-300"}>
                        <td className="p-4 text-center">{index + 1}</td>
                        <td className="p-3 text-center">{student.stdid}</td>
                        <td className="p-3">{student.name}</td>
                        <td className="p-4 text-center">{student.totalScore}</td>
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
