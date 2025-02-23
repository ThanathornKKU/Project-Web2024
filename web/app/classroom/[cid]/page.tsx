"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, onSnapshot, deleteDoc } from "firebase/firestore";
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

interface StudentData {
  uid: string;
  stdid: string;
  name: string;
  status: number; // 0: ไม่มา, 1: มาเรียน, 2: มาสาย
}

interface CheckinData {
  id: string;
  code: string;
  date: string;
  status: number;
  attending: number;
}

export default function ClassroomPage() {
  const { cid } = useParams();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
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
        const data = docSnap.data() as Omit<Classroom, "id">;
        setClassroom({ ...data, id: docSnap.id });
      } else {
        console.error("No such classroom!");
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error);
    }
  };

  // ✅ โหลดข้อมูล Check-in และคำนวณจำนวนที่มาเรียน
  const fetchCheckinData = (classroomId: string) => {
    const checkinRef = collection(db, "classroom", classroomId, "checkin");
    const q = query(checkinRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const checkinList: CheckinData[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // ตรวจสอบว่ามี `students` หรือไม่
          const studentsData: Record<string, StudentData> = data.students || {};

          // ✅ คำนวณจำนวนที่มาเรียน (status: 1 = มาเรียน, 2 = มาสาย)
          const attendingCount = Object.values(studentsData).filter(
            (student) => student.status === 1 || student.status === 2
          ).length;

          return {
            id: docSnap.id,
            code: data.code || "N/A", // ตรวจสอบว่ามี `code` หรือไม่
            date: data.date || "N/A",
            status: data.status ?? 0, // ถ้า `status` ไม่มีค่า ให้ใช้ `0`
            attending: attendingCount,
          };
        })
      );

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

  // ✅ ฟังก์ชันลบ Check-in ออกจาก Firestore
  const handleDeleteCheckin = async (checkinId: string) => {
    try {
      const confirmDelete = await Swal.fire({
        title: "ยืนยันการลบ?",
        text: "คุณแน่ใจหรือไม่ว่าต้องการลบ Check-in นี้?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "ใช่, ลบเลย!",
        cancelButtonText: "ยกเลิก",
      });

      if (confirmDelete.isConfirmed) {
        await deleteDoc(doc(db, "classroom", cid as string, "checkin", checkinId));
        Swal.fire("ลบสำเร็จ!", "Check-in ถูกลบเรียบร้อยแล้ว", "success");
      }
    } catch (error) {
      console.error("Error deleting check-in:", error);
      Swal.fire("Error!", "ไม่สามารถลบ Check-in ได้", "error");
    }
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
                className="w-full h-80 object-cover rounded-lg shadow-md"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 w-[180px]">
                {/* ✅ ปรับให้ปุ่ม Edit Classroom มีขนาดเต็ม */}
                <Link href={`/edit-classroom/${cid}`} className="w-full">
                  <button className="w-full px-4 py-2 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500">
                    Edit Classroom
                  </button>
                </Link>

                {/* ✅ ปรับให้ QR-Classroom มีขนาดเต็มและขนาดเท่ากับปุ่มด้านบน */}
                <div className="bg-white p-4 rounded-lg shadow-md w-full">
                  <h3 className="text-lg font-semibold text-center">QR-Classroom</h3>
                  <div className="flex justify-center">
                    <QRCodeCanvas value={cid as string} size={75} />
                  </div>
                  <button
                    onClick={showQRCode}
                    className="block w-full mt-2 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm hover:bg-gray-300"
                  >
                    SHOW QR-CODE
                  </button>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-semibold mt-4">{classroom.info.code} {classroom.info.name}</h2>
          </div>
        )}



        <div className="p-6 bg-gray-100 min-h-screen">
          <h2 className="text-2xl font-bold">Check-in</h2>

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
                  <th className="p-3">Attending</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">View</th>
                </tr>
              </thead>
              <tbody>
                {checkins.length > 0 ? (
                  checkins.map((checkin, index) => (
                    <tr key={checkin.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{checkin.code}</td>
                      <td className="p-3">{checkin.date}</td>
                      <td className="p-3">{checkin.attending}</td>
                      <td className="p-3">{checkin.status === 0 ? "ยังไม่เริ่ม" : checkin.status === 1 ? "กำลังเช็คชื่อ" : "เสร็จแล้ว"}</td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteCheckin(checkin.id)} className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">ลบ</button>
                      </td>
                      <td className="p-3">
                        <Link href={`/classroom/${cid}/check-in/${checkin.id}`}>
                          <button className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center p-4">No check-in records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}