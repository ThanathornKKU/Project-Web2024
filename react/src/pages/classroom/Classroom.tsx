import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, onSnapshot, deleteDoc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Navbar from "../../components/Navbar";
import { QRCodeCanvas } from "qrcode.react"; // ✅ นำเข้า QRCode ตรงๆ ไม่ต้องใช้ dynamic import

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
    attending: number;
}

export default function ClassroomPage() {
    const { cid } = useParams();
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [checkins, setCheckins] = useState<CheckinData[]>([]);
    const [score, setScore] = useState<number>(0);
    const [scoreLate, setScoreLate] = useState<number>(0);

    useEffect(() => {
        if (cid) {
            fetchClassroomData(cid);
            fetchCheckinData(cid);
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
                setScore(data.info.score || 0);
                setScoreLate(data.info.score_late || 0);
            } else {
                console.error("No such classroom!");
            }
        } catch (error) {
            console.error("Error fetching classroom data:", error);
        }
    };

    // ✅ โหลดข้อมูล Check-in
    const fetchCheckinData = async (classroomId: string) => {
        const checkinRef = collection(db, "classroom", classroomId, "checkin");
        const q = query(checkinRef);

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const checkinList: CheckinData[] = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const checkinId = docSnap.id;
                    const studentsRef = collection(db, "classroom", classroomId, "checkin", checkinId, "students");
                    const studentsSnapshot = await getDocs(studentsRef);

                    // ✅ คำนวณจำนวนที่มาเรียน
                    const attendingCount = studentsSnapshot.docs.filter((doc) => {
                        const studentData = doc.data();
                        return studentData.status === 1 || studentData.status === 2;
                    }).length;

                    return {
                        id: checkinId,
                        code: data.code || "N/A",
                        date: data.date || "N/A",
                        status: data.status ?? 0,
                        attending: attendingCount,
                    };
                })
            );

            checkinList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setCheckins(checkinList);
        });

        return () => unsubscribe();
    };

    // ✅ แสดง QR Code
    const showQRCode = () => {
        MySwal.fire({
            title: "Classroom QR Code",
            html: (
                <div className="flex justify-center">
                    <QRCodeCanvas value={cid || ""} size={380} />
                </div>
            ),
            showCloseButton: true,
            showConfirmButton: false,
        });
    };

    // ✅ อัปเดตคะแนนเข้าเรียน
    const updateScore = async () => {
        if (!cid) return;

        try {
            const classroomRef = doc(db, "classroom", cid);

            await updateDoc(classroomRef, {
                "info.score": score,
                "info.score_late": scoreLate,
            });

            Swal.fire("Success!", "คะแนนอัปเดตเรียบร้อยแล้ว", "success");
        } catch (error) {
            console.error("❌ Error updating student scores:", error);
            Swal.fire("Error!", "ไม่สามารถอัปเดตคะแนนได้", "error");
        }
    };

    // ✅ เปลี่ยนสถานะ Check-in
    const toggleCheckinStatus = async (checkinId: string, newStatus: number) => {
        try {
            await updateDoc(doc(db, "classroom", cid as string, "checkin", checkinId), {
                status: newStatus,
            });
        } catch (error) {
            console.error("Error updating check-in status:", error);
            Swal.fire("Error!", "ไม่สามารถเปลี่ยนสถานะได้", "error");
        }
    };

    // ✅ ลบ Check-in
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
        <div className="p-6 bg-gray-100 min-h-screen">
            <Navbar />

            {classroom && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <div className="relative w-full">
                        <img
                            src={classroom.info.photo || "https://via.placeholder.com/150"}
                            alt="Classroom"
                            className="w-full h-96 object-cover rounded-lg shadow-md"
                        />
                        <div className="absolute top-4 right-4 flex flex-col gap-2 w-[180px]">
                            <Link to={`/edit-classroom/${cid}`} className="w-full">
                                <button className="w-full px-4 py-2 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500">
                                    Edit Classroom
                                </button>
                            </Link>

                            <div className="bg-white p-4 rounded-lg shadow-md w-full">
                                <h3 className="text-lg font-semibold text-center">QR-Classroom</h3>
                                <div className="flex justify-center">
                                    <QRCodeCanvas value={cid || ""} size={75} />
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
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-4 mt-4">
                        <label className="font-semibold">คะแนนเข้าเรียน:</label>
                        <input
                            type="number"
                            value={score}
                            onChange={(e) => setScore(parseFloat(e.target.value))}
                            className="border px-2 py-1 w-16 text-center"
                        />
                        <label className="font-semibold">คะแนนเข้าเรียนสาย:</label>
                        <input
                            type="number"
                            value={scoreLate}
                            onChange={(e) => setScoreLate(parseFloat(e.target.value))}
                            className="border px-2 py-1 w-16 text-center"
                        />
                        <button onClick={updateScore} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Save
                        </button>
                    </div>
                    <Link to={`/classroom/${cid}/create-checkin`}>
                        <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            + Add Check-in
                        </button>
                    </Link>
                </div>
                <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-3 text-center">No</th>
                                <th className="p-3 text-center">Code</th>
                                <th className="p-3 text-center">Date</th>
                                <th className="p-3 text-center">Attending</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checkins.length > 0 ? (
                                checkins.map((checkin, index) => (
                                    <tr key={checkin.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                                        <td className="p-3 text-center">{index + 1}</td>
                                        <td className="p-3 text-center">{checkin.code}</td>
                                        <td className="p-3 text-center">{checkin.date}</td>
                                        <td className="p-3 text-center">{checkin.attending}</td>
                                        {/* ✅ ปุ่ม Toggle เปลี่ยนสถานะ */}
                                        <td className="p-3 text-center">
                                            <div className="inline-flex rounded-full border border-black bg-gray-200 overflow-hidden">
                                                {["ปิด", "กำลัง", "เช็คสาย"].map((label, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (checkin.status !== idx) {
                                                                toggleCheckinStatus(checkin.id, idx); // ✅ เปลี่ยนเป็นค่า idx ที่ถูกต้อง
                                                            }
                                                        }}
                                                        className={`px-4 py-1 text-sm transition-all duration-200 flex-1 ${checkin.status === idx ? "bg-gray-500 text-white" : "bg-white text-black"
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleDeleteCheckin(checkin.id)} className="me-1 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">ลบ</button>
                                            <Link to={`/classroom/${cid}/check-in/${checkin.id}`}>
                                                <button className=" ms-1 px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">View</button>
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
    );
}