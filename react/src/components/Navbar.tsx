import { Link, useParams, useLocation } from "react-router-dom";

export default function Navbar() {
  const { cid } = useParams<{ cid: string }>(); // ✅ ดึง `cid` จาก URL
  const location = useLocation(); // 🔥 ใช้ `useLocation()` แทน `usePathname()`

  // ✅ ฟังก์ชันเช็คว่าหน้านี้เป็น active หรือไม่
  const isActive = (path: string) =>
    location.pathname === path
      ? "font-semibold text-green-600 border-b-2 border-green-600 pb-2 cursor-pointer"
      : "hover:text-green-600 cursor-pointer";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex space-x-4 text-gray-600 border-b">
      <Link to={`/classroom/${cid}`}>
        <span className={isActive(`/classroom/${cid}`)}>Dashboard</span>
      </Link>
      {/* <Link to={`/classroom/${cid}/qna`}>
        <span className={isActive(`/classroom/${cid}/qna`)}>Q&A</span>
      </Link>
      <Link to={`/classroom/${cid}/check-in`}>
        <span className={isActive(`/classroom/${cid}/check-in`)}>Check-in</span>
      </Link> */}
      <Link to={`/classroom/${cid}/student-score`}>
        <span className={isActive(`/classroom/${cid}/student-score`)}>Scores</span>
      </Link>
      <Link to={`/classroom/${cid}/show-student`}>
        <span className={isActive(`/classroom/${cid}/show-student`)}>Students</span>
      </Link>
    </div>
  );
}