"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { FaEye, FaTrash } from "react-icons/fa"; 

export default function QuestionManager({ cid, cno }: { cid: string; cno: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");

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
        if (newQuestion.trim()) {
            const qRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
            const docRef = await addDoc(qRef, { question_text: newQuestion, question_show: false });
            setQuestions([...questions, { qid: docRef.id, question_text: newQuestion, question_show: false }]);
            setNewQuestion("");
            setIsOpen(false);
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
        const qRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, qid);
        await deleteDoc(qRef);

        setQuestions(questions.filter((q) => q.qid !== qid));
    };

    return (
        <div className="mt-6 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
            {/* ปุ่มสร้างคำถาม */}
            <div className="flex justify-end mb-4">
                <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setIsOpen(true)}>
                    + Add Question
                </button>
            </div>


            {/* ตารางแสดงคำถาม */}
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-gray-300 bg-gray-200">
                        <th className="p-2 border text-black">Question_No</th>
                        <th className="p-2 border text-black">คำถาม</th>
                        <th className="p-2 border text-black">Show Questions</th>
                        <th className="p-2 border text-black">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {questions.map((q, index) => (
                        <tr key={q.qid} className="even:bg-gray-100">
                            <td className="p-2 border text-center text-black">{index + 1}</td>
                            <td className="p-2 border text-black">{q.question_text}</td>
                            <td className="p-2 border text-center text-black">
                                <input
                                    type="checkbox"
                                    checked={q.question_show}
                                    onChange={() => handleToggleVisibility(q.qid, !q.question_show)}
                                />
                            </td>
                            <td className="p-2 border text-center">
                            <Link href={`/classroom/${cid}/check-in/${cno}/question/${q.qid}`}>
                                <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
                                    <FaEye />
                                </button>
                            </Link>
                                <button onClick={() => handleDelete(q.qid)} className="bg-red-500 text-white px-3 py-1 rounded">
                                    🗑
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Popup สร้างคำถาม */}
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg">
                        <h2 className="text-lg font-bold">สร้างคำถาม</h2>
                        <textarea
                            className="w-full border p-2"
                            placeholder="คำถาม *"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                        />
                        <div className="mt-2 flex justify-end">
                            <button className="bg-red-500 text-white px-3 py-1 rounded mr-2" onClick={() => setIsOpen(false)}>
                                ปิด
                            </button>
                            <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={handleAddQuestion}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
