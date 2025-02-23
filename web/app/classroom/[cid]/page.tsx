"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Image from "next/image";
import Navbar from "@/app/components/navbar";

const QRCodeCanvas = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeCanvas), { ssr: false });

const MySwal = withReactContent(Swal);

interface ClassroomInfo {
  code: string;
  name: string;
  photo: string;
  room: string;
  score?: number;
  score_late?: number;
}

interface Classroom {
  id: string;
  owner: string;
  info: ClassroomInfo;
}

interface CheckinData {
  id: string;
  code: string;
  date: string;
  status: number;
}

export default function ClassroomPage() {
  const { cid } = useParams();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [attendanceScore, setAttendanceScore] = useState(1);
  const [lateScore, setLateScore] = useState(0.5);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);

  useEffect(() => {
    if (cid) {
      fetchClassroomData(cid as string);
      fetchCheckinData(cid as string);
    }
  }, [cid]);

  // ✅ โหลดข้อมูลห้องเรียนจาก Firestore
  const fetchClassroomData = async (classroomId: string) => {
    try {
      const docRef = doc(db, "classroom", classroomId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Classroom, "id">; // 🔥 ลบ id ออกจาก data ก่อน
        setClassroom({ ...data, id: docSnap.id }); // ✅ กำหนด id ใหม่
      } else {
        console.error("No such classroom!");
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error);
    }
  };

  // ✅ โหลดข้อมูล Check-in แบบเรียลไทม์
  const fetchCheckinData = (classroomId: string) => {
    const checkinRef = collection(db, "classroom", classroomId, "checkin");
    const q = query(checkinRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checkinList: CheckinData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<CheckinData, "id">; // 🔥 ลบ id ออกจาก data ก่อน
        return { ...data, id: doc.id }; // ✅ กำหนด id ใหม่
      });
      setCheckins(checkinList);
    });

    return () => unsubscribe();
  };

  const showQRCode = () => {
    MySwal.fire({
      title: "Classroom QR Code",
      html: (
        <div className="flex justify-center">
          <QRCodeCanvas value={cid as string} size={380} />
        </div>
      ),
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  return (
    <>
      <title>Classroom</title>
      <div className="p-6 bg-gray-100 min-h-screen">
        <Navbar />

        {classroom && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <div className="relative w-full">
              <Image
                src={classroom.info.photo || "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg"}
                alt="Classroom"
                width={400}
                height={300}
                className="w-full object-cover rounded-lg shadow-md"
              />
              <button className="absolute top-4 right-4 px-4 py-2 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500">
                <Link href={`/edit-classroom/${cid}`}>
                  Edit Classroom
                </Link>
              </button>
            </div>
            <h2 className="text-xl font-semibold mt-4">{classroom.info.code} {classroom.info.name}</h2>
          </div>
        )}

        <div className="mt-6 flex">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">QR-Classroom</h3>
            <QRCodeCanvas value={cid as string} size={75} />
            <button
              onClick={showQRCode}
              className="block w-full mt-2 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm hover:bg-gray-300"
            >
              SHOW QR-CODE
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-100 min-h-screen">
          <h2 className="text-2xl font-bold">Check-in</h2>

          <div className="flex items-center space-x-4 mt-4">
            <div>
              <label className="text-sm font-medium">คะแนนเข้าเรียน:</label>
              <input
                type="number"
                value={attendanceScore}
                onChange={(e) => setAttendanceScore(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-16 text-center"
              />
            </div>
            <div>
              <label className="text-sm font-medium">คะแนนเข้าเรียนสาย:</label>
              <input
                type="number"
                value={lateScore}
                onChange={(e) => setLateScore(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-16 text-center"
              />
            </div>
          </div>

          <Link href={`/classroom/${cid}/create-checkin`}>
            <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              + Add Check-in
            </button>
          </Link>

          <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">No</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {checkins.length > 0 ? (
                  checkins.map((checkin, index) => (
                    <tr key={checkin.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{checkin.code}</td>
                      <td className="p-3">{checkin.date}</td>
                      <td className="p-3">
                        {checkin.status === 0 ? "ยังไม่เริ่ม" : checkin.status === 1 ? "กำลังเช็คชื่อ" : "เสร็จแล้ว"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-4">No check-in records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}