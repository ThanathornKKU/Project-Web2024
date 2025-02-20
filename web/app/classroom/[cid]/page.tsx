"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// ✅ ใช้ Dynamic Import ป้องกัน `QRCodeCanvas is not a constructor`
const QRCodeCanvas = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeCanvas), { ssr: false });

// ✅ ใช้ SweetAlert2 ที่รองรับ React
const MySwal = withReactContent(Swal);

interface ClassroomInfo {
  code: string;
  name: string;
  photo: string;
  room: string;
}

interface Classroom {
  id: string;
  owner: string;
  info: ClassroomInfo;
}

export default function ClassroomPage() {
  const { cid } = useParams();
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  useEffect(() => {
    if (cid) {
      fetchClassroomData(cid as string);
    }
  }, [cid]);

  const fetchClassroomData = async (classroomId: string) => {
    try {
      const docRef = doc(db, "classroom", classroomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setClassroom({ id: docSnap.id, ...docSnap.data() } as Classroom);
      } else {
        console.error("No such classroom!");
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error);
    }
  };

  // ✅ ใช้ SweetAlert2 แสดง QR Code ใน React Component
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
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Navigation Tabs */}
      <div className="bg-white p-4 rounded-lg shadow-md flex space-x-4 text-gray-600 border-b">
        <span className="font-semibold text-green-600 border-b-2 border-green-600 pb-2">Dashboard</span>
        <span className="hover:text-green-600 cursor-pointer">Q&A</span>
        <span className="hover:text-green-600 cursor-pointer">Check-in</span>
        <span className="hover:text-green-600 cursor-pointer">Scores</span>
        <span className="hover:text-green-600 cursor-pointer">Students</span>
      </div>

      {/* Classroom Header */}
      {classroom && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="relative">
            <img
              src={classroom.info.photo || "https://via.placeholder.com/800x200"}
              alt="Classroom"
              className="w-full h-52 object-cover rounded-lg"
            />
            <button className="absolute top-4 right-4 px-4 py-2 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500">
              Edit Classroom
            </button>
          </div>
          <h2 className="text-xl font-semibold mt-4">{classroom.info.code} {classroom.info.name}</h2>
        </div>
      )}

      {/* QR Code Section */}
      <div className="mt-6 flex">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">QR-Classroom</h3>
          <QRCodeCanvas value={cid as string} size={150} />
          <button
            onClick={showQRCode}
            className="block w-full mt-2 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm hover:bg-gray-300"
          >
            SHOW QR-CODE
          </button>
        </div>
      </div>
    </div>
  );
}
