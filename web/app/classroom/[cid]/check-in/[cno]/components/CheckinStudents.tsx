"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { QRCodeCanvas } from "qrcode.react";

const MySwal = withReactContent(Swal);

interface CheckinStudent {
  uid: string;
  stdid: string;
  name: string;
  score: number;
  remark: string;
  date: string;
  status: number;
}

export default function CheckinStudents() {
  const { cid, cno } = useParams<{ cid: string; cno: string }>();
  const [students, setStudents] = useState<CheckinStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinDate, setCheckinDate] = useState<string>("");
  
  useEffect(() => {
    if (cid && cno) {
      fetchCheckinData(cid, cno);
      fetchCheckinStudents(cid, cno);
    }
  }, [cid, cno]);

  const fetchCheckinData = async (classroomId: string, checkinNo: string) => {
    try {
      const checkinRef = doc(db, `classroom/${classroomId}/checkin`, checkinNo);
      const checkinSnap = await getDoc(checkinRef);
      if (checkinSnap.exists()) {
        setCheckinDate(checkinSnap.data().date);
      }
    } catch (error) {
      console.error("Error fetching check-in date:", error);
    }
  };

  const fetchCheckinStudents = async (classroomId: string, checkinNo: string) => {
    setLoading(true);
    try {
      const studentsRef = collection(db, `classroom/${classroomId}/checkin/${checkinNo}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsList = studentsSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as CheckinStudent[];

      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching check-in students:", error);
    }
    setLoading(false);
  };

  const showQRCode = () => {
    if (!cno) {
      MySwal.fire({
        title: "Error",
        text: "Check-in QR Code not found!",
        icon: "error",
      });
      return;
    }

    MySwal.fire({
      title: "Classroom QR Code",
      html: (
        <div className="flex justify-center">
          <QRCodeCanvas value={cno} size={380} />
        </div>
      ),
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  return (
    <div className="max-w-9xl w-full bg-white p-8 shadow-lg rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">รายชื่อนักเรียนที่เช็คอิน</h2>
          <span className="text-black font-bold text-2xl">{checkinDate}</span>
        </div>

        <div className="flex">
          <div className="bg-white border p-4 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold">QR-Classroom</h3>
            <button
              onClick={showQRCode}
              className="block w-full mt-2 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm hover:bg-gray-300"
            >
              SHOW QR-CODE
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading students...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b-2 border-black">
              <th className="p-3 font-semibold">ลำดับ</th>
              <th className="p-3 font-semibold">รหัสนักศึกษา</th>
              <th className="p-3 font-semibold">ชื่อ - นามสกุล</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Score</th>
              <th className="p-3 font-semibold">Remark</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              [...students]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // ✅ เรียงลำดับตามเวลาเช็คอิน
                .map((student, index) => (
                  <tr key={student.uid} className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}>
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{student.stdid}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.date}</td>
                    <td className="p-3">{student.status === 1 ? "มาเรียน" : student.status === 2 ? "มาสาย" : "ขาดเรียน"}</td>
                    <td className="p-3">{student.score}</td>
                    <td className="p-3">{student.remark}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
