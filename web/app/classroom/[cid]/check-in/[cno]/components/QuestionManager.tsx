"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { FaEye, FaTrash, FaRegQuestionCircle } from "react-icons/fa";
import Swal from "sweetalert2";

export default function QuestionManager({ cid, cno }: { cid: string; cno: string }) {
    const [questions, setQuestions] = useState<any[]>([]);

    // 🔹 ดึงข้อมูลคำถามจาก Firestore
    useEffect(() => {
        const fetchQuestions = async () => {
            const qRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
            const snapshot = await getDocs(qRef);
            const data = snapshot.docs.map((doc) => ({
                qid: doc.id,
                ...doc.data(),
            }));
            setQuestions(data);
        };

        fetchQuestions();
    }, [cid, cno]);

    // 🔹 ฟังก์ชันเพิ่มคำถาม
    const handleAddQuestion = async () => {
        const { value: newQuestion } = await Swal.fire({
            title: "สร้างคำถามใหม่",
            input: "textarea",
            inputPlaceholder: "กรอกคำถามที่ต้องการ...",
            inputAttributes: {
                "aria-label": "กรอกคำถามที่ต้องการ"
            },
            showCancelButton: true,
            confirmButtonText: "บันทึก",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
            inputValidator: (value) => {
                if (!value.trim()) {
                    return "กรุณากรอกคำถาม!";
                }
            }
        });

        if (newQuestion) {
            const qRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
            const docRef = await addDoc(qRef, { question_text: newQuestion, question_show: false });
            setQuestions([...questions, { qid: docRef.id, question_text: newQuestion, question_show: false }]);

            // ✅ แสดง Alert ว่าเพิ่มสำเร็จ
            Swal.fire({
                title: "บันทึกสำเร็จ!",
                text: "คำถามถูกเพิ่มเรียบร้อย",
                icon: "success",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "ตกลง",
            });
        }
    };

    // 🔹 ฟังก์ชันเปลี่ยนสถานะ Show/Hide
    const handleToggleVisibility = async (qid: string, visible: boolean) => {
        const qCollection = collection(db, `classroom/${cid}/checkin/${cno}/question`);

        // 📌 ดึงคำถามทั้งหมดจาก Firestore
        const snapshot = await getDocs(qCollection);
        const allQuestions = snapshot.docs.map((doc) => ({
            qid: doc.id,
            ...doc.data(),
        }));

        // 🔹 ปิดคำถามอื่นๆ ทั้งหมดก่อน
        const updatePromises = allQuestions.map(async (q) => {
            const qRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, q.qid);
            return updateDoc(qRef, { question_show: false });
        });

        // 🔹 อัปเดตสถานะของคำถามที่เลือก (ถ้าผู้ใช้เลือกเปิด)
        if (visible) {
            const selectedQRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, qid);
            updatePromises.push(updateDoc(selectedQRef, { question_show: true }));
        }

        // ✅ ทำการอัปเดตทั้งหมดพร้อมกัน
        await Promise.all(updatePromises);

        // ✅ อัปเดต state ใน React
        setQuestions(allQuestions.map((q) => ({
            ...q,
            question_show: q.qid === qid ? visible : false,
        })));
    };

    // 🔹 ฟังก์ชันลบคำถาม
    const handleDelete = async (qid: string) => {
        Swal.fire({
            title: "ยืนยันการลบ",
            text: "คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก",
        }).then(async (result) => {
            if (result.isConfirmed) {
                // ✅ ลบคำถามเมื่อกด "ลบ"
                const qRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, qid);
                await deleteDoc(qRef);
                setQuestions(questions.filter((q) => q.qid !== qid));

                // ✅ แสดง Alert ว่าลบสำเร็จ
                Swal.fire({
                    title: "ลบสำเร็จ",
                    text: "คำถามถูกลบออกจากระบบแล้ว",
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "ตกลง",
                });
            }
        });
    };


    return (
        <div className="mt-6 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
            {/* 🔹 ส่วนหัวของ Q&A */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Q&A</h2>
                <button className="bg-green-500 text-white px-4 py-2 rounded shadow-md hover:bg-green-600 transition"
                    onClick={handleAddQuestion}>
                    + Add Question
                </button>
            </div>

            {/* เช็คว่ามีคำถามหรือไม่ */}
            {questions.length > 0 ? (
                <div className="mx-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-500">
                                <th className="p-3 text-left text-black">Question_No</th>
                                <th className="p-3 text-left text-black">คำถาม</th>
                                <th className="p-3 text-center text-black">Show Questions</th>
                                <th className="p-3 text-center text-black">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q, index) => (
                                <tr key={q.qid} className="even:bg-gray-100">
                                    <td className="p-3 text-center text-black">{index + 1}</td>
                                    <td className="p-3 text-black">{q.question_text}</td>
                                    <td className="p-3 text-center text-black">
                                        <input
                                            type="checkbox"
                                            checked={q.question_show}
                                            onChange={() => handleToggleVisibility(q.qid, !q.question_show)}
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-x-6">
                                            <Link href={`/classroom/${cid}/check-in/${cno}/question/${q.qid}`}>
                                                <button className="text-blue-500 hover:text-blue-700 transition px-3">
                                                    <FaEye size={18} />
                                                </button>
                                            </Link>
                                            <button onClick={() => handleDelete(q.qid)}
                                                className="text-gray-400 hover:text-red-700 transition px-3">
                                                <FaTrash size={18} />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            ) : (
                /* ยังไม่มีคำถามที่สร้าง */
                <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg py-10 shadow-inner">
                    <FaRegQuestionCircle className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg font-medium mb-4">ยังไม่มีคำถามที่สร้าง</p>
                </div>
            )}
        </div>
    );

}
