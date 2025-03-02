"use client";
import React, { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import NavbarSecond from "@/app/components/navbar-second";
import CheckinStudents from "./components/CheckinStudents";
import QuestionManager from "./components/QuestionManager";

export default function CheckinPage() {
  const { cid, cno } = useParams<{ cid: string; cno: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "checkin"; // ✅ ดึง tab จาก URL, ถ้าไม่มีใช้ "checkin"
  const [checkinDate, setCheckinDate] = React.useState<string>("");

  useEffect(() => {
    const fetchCheckinDate = async () => {
      if (cid && cno) {
        try {
          const checkinRef = doc(db, `classroom/${cid}/checkin`, cno);
          const checkinSnap = await getDoc(checkinRef);
          if (checkinSnap.exists()) {
            setCheckinDate(checkinSnap.data().date);
          }
        } catch (error) {
          console.error("Error fetching check-in date:", error);
        }
      }
    };

    fetchCheckinDate();
  }, [cid, cno]);

  // ✅ ฟังก์ชันเปลี่ยน tab และอัปเดต URL parameter
  const changeTab = (newTab: string) => {
    router.push(`?tab=${newTab}`, { scroll: false });
  };

  // ✅ ฟังก์ชันตรวจสอบว่า tab ไหนถูกเลือก
  const isActive = (currentTab: string) =>
    tab === currentTab
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
              <span className="text-black cursor-pointer">Check-in</span>
              {" > "}
              <span className="text-black font-bold">{checkinDate}</span>
            </div>

            <div className="bg-white text-lg mt-4 p-4 space-x-4">
              <span className={`${isActive("checkin")}`} onClick={() => changeTab("checkin")}>
                Check-in
              </span>

              <span className={`${isActive("qna")}`} onClick={() => changeTab("qna")}>
                Q & A
              </span>
            </div>
          </div>

          {/* ✅ แสดง Component ตามค่าของ `tab` */}
          {tab === "qna" ? <QuestionManager cid={cid} cno={cno} /> : <CheckinStudents />}
        </div>
      </div>
    </>
  );
}
