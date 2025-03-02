"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import QuestionManager from "@/app/classroom/[cid]/check-in/[cno]/components/QuestionManager";


export default function NavbarSecond() {
  const { cid, cno } = useParams<{ cid: string; cno: string }>(); // ✅ ดึง `cid` และ `cno`
  const pathname = usePathname(); // 🔥 ดึง path ปัจจุบัน
  const [showQnA, setShowQnA] = useState(false); // ✅ state สำหรับแสดง QuestionManager

  // ✅ ฟังก์ชันเช็คว่าหน้านี้เป็น active หรือไม่
  const isActive = (path: string) =>
    pathname === path
      ? "font-semibold text-green-600 border-b-2 border-green-600 pb-2 cursor-pointer"
      : "hover:text-green-600 cursor-pointer";

  return (
    <div>
      {/* ✅ Navbar */}
      <div className="bg-white p-4 rounded-lg shadow-md flex space-x-4 text-gray-600 border-b">
        <Link href={`/classroom/${cid}/check-in/${cno}`}>
          <span className={isActive(`/classroom/${cid}/check-in/${cno}`)}>Check-in</span>
        </Link>

        {/* ✅ กดแล้วแสดง QuestionManager.tsx */}
        <span
          className={`${isActive("")} cursor-pointer`}
          onClick={() => setShowQnA(!showQnA)}
        >
          Q & A
        </span>
      </div>

      {/* ✅ ถ้า showQnA เป็น true ให้แสดง QuestionManager */}
      {showQnA && <QuestionManager cid={cid} cno={cno} />}
    </div>
  );
}
