import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // ✅ ใช้จาก `react-router-dom`
import { db } from "../../../lib/firebase"; // ✅ เปลี่ยน Path ให้ถูกต้อง
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { QRCodeCanvas } from "qrcode.react";

const MySwal = withReactContent(Swal);

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
  const { cid, cno } = useParams(); // ✅ ใช้ React Router `useParams()`
  const [students, setStudents] = useState<CheckinStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setCheckinDate] = useState<string>("");

  useEffect(() => {
    if (cid && cno) {
      fetchCheckinData(cid, cno);
      fetchCheckinStudents(cid, cno);
    }
  }, [cid, cno]);

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

  const showQRCode = () => {
    if (!cno) {
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <QRCodeCanvas value={"cno" + cno} size={380} />
        </div>
      ),
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  return (
    <div className="mt-2 max-w-9xl w-full p-8">
      {loading ? (
        <p className="text-gray-600">Loading students...</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">รายชื่อนักเรียนที่เช็คอิน</h2>
            <div className="bg-white border p-0 rounded-lg shadow-md text-center">
              <button
                onClick={showQRCode}
                className="block w-full bg-white text-black p-2 rounded-lg text-sm hover:bg-gray-300"
              >
                SHOW QR-CODE
              </button>
            </div>
          </div>

          <table className="w-full border-collapse text-left">
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
                students
                  .sort((a, b) => a.status - b.status || new Date(a.date).getTime() - new Date(b.date).getTime()) // ✅ เรียงตามสถานะ และวันที่
                  .map((student, index) => (
                    <tr key={student.uid} className={student.status === 0 ? "bg-gray-200 text-gray-500" : index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{student.stdid}</td>
                      <td className="p-3">{student.name}</td>
                      <td className="p-3">{student.date}</td>
                      <td className={`p-3 font-bold ${student.status === 1 ? "text-green-600" : student.status === 2 ? "text-yellow-600" : "text-gray-500"}`}>
                        {student.status === 1 ? "มาเรียน" : student.status === 2 ? "มาสาย" : "ขาดเรียน"}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="border border-gray-300 p-1 rounded w-16 text-center"
                          value={student.score}
                          onChange={(e) => {
                            const newScore = Math.max(0, Number(e.target.value));
                            setStudents((prev) => prev.map((s) => (s.stdid === student.stdid ? { ...s, score: newScore } : s)));
                          }}
                          onBlur={async () => {
                            const studentRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${student.uid}`);
                            await updateDoc(studentRef, { score: student.score });
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          className="border border-gray-300 p-1 rounded w-full"
                          value={student.remark ?? ""}
                          onChange={(e) => {
                            const newRemark = e.target.value;
                            setStudents((prev) => prev.map((s) => (s.stdid === student.stdid ? { ...s, remark: newRemark } : s)));
                          }}
                          onBlur={async () => {
                            const studentRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${student.uid}`);
                            await updateDoc(studentRef, { remark: student.remark });
                          }}
                        />
                      </td>
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
        </>
      )}
    </div>
  );
}