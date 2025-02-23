"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import NavbarSecon from "@/app/components/navbar-second";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { QRCodeCanvas } from "qrcode.react"; // ✅ เพิ่ม import
import NavbarSecond from "@/app/components/navbar-second";

const MySwal = withReactContent(Swal); // ✅ เพิ่ม MySwal

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
  const { cid, cno } = useParams<{ cid: string; cno: string }>(); // ดึง cid, cno จาก URL
  const [students, setStudents] = useState<CheckinStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinDate, setCheckinDate] = useState<string>("");
  const [checkinCode, setCheckinCode] = useState<string>(""); // ✅ เพิ่ม state สำหรับ QR Code


  useEffect(() => {
    if (cid && cno) {
      fetchCheckinData(cid, cno);
      fetchCheckinStudents(cid, cno);
      fetchCheckinCode(cid, cno); // ✅ เรียก fetchCheckinCode()
    }
  }, [cid, cno]);

  // ดึงข้อมูล check-in (เช่น วันที่)
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

  // ดึงข้อมูลนักเรียนที่เช็คอิน
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

  // ✅ ดึงรหัส QR Code ของ check-in จาก Firestore
  const fetchCheckinCode = async (classroomId: string, checkinNo: string) => {
    try {
      const checkinRef = doc(db, `classroom/${classroomId}/checkin`, checkinNo);
      const checkinSnap = await getDoc(checkinRef);

      if (checkinSnap.exists()) {
        setCheckinCode(checkinSnap.data().code); // ✅ ดึงค่า `code`
      }
    } catch (error) {
      console.error("Error fetching check-in code:", error);
    }
  };

  // ✅ แสดง QR Code ด้วย SweetAlert2
  const showQRCode = () => {
    if (!checkinCode) {
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
          <QRCodeCanvas value={checkinCode} size={380} />
        </div>
      ),
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  return (
    <>
      <title>Check-in Students</title>
      <div className="min-h-screen bg-gray-100 p-6">
        <NavbarSecond />
        <div className="flex flex-col items-center mt-6">

          <div className="max-w-9xl w-full bg-white p-8 shadow-lg rounded-lg">
            {/* ✅ Breadcrumb */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold mb-4">
                  <Link href={`/classroom/${cid}`} className="text-blue-600 hover:underline">
                    Check-in
                  </Link>
                  {" > "}
                  <span className="text-black font-bold">{checkinDate}</span>
                </div>

                <h2 className="text-2xl font-bold mb-4">รายชื่อนักเรียนที่เช็คอิน</h2>
              </div>
              {/* ✅ QR Code Section */}
              <div className="flex">
                <div className="bg-white border p-4 rounded-lg shadow-md text-center">
                  <h3 className="text-lg font-semibold">QR-Classroom</h3>

                  {/* ✅ แสดง QR Code ขนาดเล็ก */}
                  {/* <QRCodeCanvas value={checkinCode || "Loading..."} size={75} /> */}

                  {/* ✅ ปุ่มแสดง QR Code ขนาดใหญ่ */}
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
                    students.map((student, index) => (
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
        </div>
      </div>
    </>
  );
}
