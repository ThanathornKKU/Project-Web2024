import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { db } from "../../../lib/firebase"; // ✅ เปลี่ยน Path import
import { doc, getDoc } from "firebase/firestore";
import NavbarSecond from "../../../components/NavbarSecond";
import CheckinStudents from "./CheckinStudents";
import QuestionManager from "./QuestionManager";

export default function CheckinPage() {
  const { cid, cno } = useParams(); // ✅ ดึงค่า `cid` และ `cno` จาก URL
  const location = useLocation(); // ✅ ใช้ดึง query params จาก URL
  const navigate = useNavigate(); // ✅ ใช้สำหรับเปลี่ยน tab ใน URL
  const [checkinDate, setCheckinDate] = useState<string>("");

  // ✅ อ่านค่าจาก Query Parameter
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "checkin";

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

  // ✅ ฟังก์ชันเปลี่ยน tab และอัปเดต URL
  const changeTab = (newTab: string) => {
    navigate(`?tab=${newTab}`, { replace: true });
  };

  // ✅ ฟังก์ชันเช็คว่า tab ไหนถูกเลือก
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
              <Link to={`/classroom/${cid}`} className="text-black">
                Dashboard
              </Link>
              {" > "}
              <span className="text-black cursor-pointer">Check-in</span>
              {" > "}
              <span className="text-black font-bold">{checkinDate}</span>
            </div>

            {/* ✅ Navbar สำหรับเปลี่ยน Tab */}
            <div className="bg-white text-lg mt-4 p-4 space-x-4">
              <span className={isActive("checkin")} onClick={() => changeTab("checkin")}>
                Check-in
              </span>
              <span className={isActive("qna")} onClick={() => changeTab("qna")}>
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