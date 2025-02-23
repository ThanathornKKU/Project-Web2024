"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function NavbarSecond() {
  const { cid, cno } = useParams<{ cid: string; cno: string }>(); // ✅ ดึง `cid` และ `cno`
  const pathname = usePathname(); // 🔥 ดึง path ปัจจุบัน

  // ✅ ฟังก์ชันเช็คว่าหน้านี้เป็น active หรือไม่
  const isActive = (path: string) =>
    pathname === path
      ? "font-semibold text-green-600 border-b-2 border-green-600 pb-2 cursor-pointer"
      : "hover:text-green-600 cursor-pointer";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex space-x-4 text-gray-600 border-b">
      {/* ✅ Check-in path ถูกต้องแล้ว */}
      <Link href={`/classroom/${cid}/check-in/${cno}`}>
        <span className={isActive(`/classroom/${cid}/check-in/${cno}`)}>Check-in</span>
      </Link>
      
      {/* ✅ Q & A path ถูกต้องแล้ว */}
      <Link href={`/classroom/${cid}/check-in/${cno}/qna`}>
        <span className={isActive(`/classroom/${cid}/check-in/${cno}/qna`)}>Q & A</span>
      </Link>
    </div>
  );
}
