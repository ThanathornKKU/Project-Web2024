"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import NavbarSecond from "@/app/components/navbar-second";
import CheckinStudents from "./components/CheckinStudents"; // ✅ Import CheckinStudents
import QuestionManager from "./components/QuestionManager"; // ✅ Import QuestionManager
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CheckinPage() {
  const { cid, cno } = useParams<{ cid: string; cno: string }>(); // ✅ ดึง cid, cno จาก URL
  const [showQnA, setShowQnA] = useState(false); // ✅ state สำหรับเลือกแสดง Q&A หรือ Check-in
  const [checkinDate, setCheckinDate] = useState<string>(""); // ✅ State สำหรับเก็บวันที่ Check-in

  // ✅ ดึงวันที่ของ Check-in จาก Firestore
  useEffect(() => {
    const fetchCheckinDate = async () => {
      if (cid && cno) {
        try {
          const checkinRef = doc(db, `classroom/${cid}/checkin`, cno);
          const checkinSnap = await getDoc(checkinRef);
          if (checkinSnap.exists()) {
            setCheckinDate(checkinSnap.data().date); // ✅ ดึงค่า date
          }
        } catch (error) {
          console.error("Error fetching check-in date:", error);
        }
      }
    };

    fetchCheckinDate();
  }, [cid, cno]);

  // ✅ ฟังก์ชันตรวจสอบว่า tab ไหนถูกเลือก
  const isActive = (path: string) =>
    (!showQnA && path === "checkin") || (showQnA && path === "qna")
      ? "font-semibold text-green-600 border-b-2 border-green-600 pb-2 cursor-pointer"
      : "hover:text-green-600 cursor-pointer";

  return (
    <>
      <title>Check-in</title>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white border pt-2 rounded-lg shadow-md text-center">
          <div className="text-left p-4">

            <div className="font-bold text-2xl px-4">
              <Link href={`/classroom/${cid}`} className="text-black">
                Dashboard
              </Link>
              {" > "}
              <span className="text-black cursor-pointer">
                Check-in
              </span>
              {" > "}
              <span className="text-black font-bold">{checkinDate}</span>
            </div>
            
            <div className="bg-white text-lg mt-4 p-4 space-x-4">
              <span
                className={`${isActive("checkin")} cursor-pointer`}
                onClick={() => setShowQnA(false)}
              >
                Check-in
              </span>

              <span
                className={`${isActive("qna")} cursor-pointer`}
                onClick={() => setShowQnA(true)}
              >
                Q & A
              </span>
            </div>
          </div>
          {/* ✅ แสดง Component ตามค่าของ `showQnA` */}
          {showQnA ? <QuestionManager cid={cid} cno={cno} /> : <CheckinStudents />}
        </div>
      </div>
    </>
  );
}
